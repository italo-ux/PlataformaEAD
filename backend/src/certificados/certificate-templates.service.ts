import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import {
  CertificateLogoDto,
  CertificateSignatureDto,
  CreateCertificateTemplateDto,
  SyncCertificateTemplatesDto,
} from './dto/certificate-template.dto';
import {
  CertificateTemplate,
  CertificateTemplateAsset,
} from './certificate-template.entity';
import {
  CertificateAssetKind,
  CertificateTemplateSnapshot,
  LEGACY_CERTIFICATE_TEMPLATE,
} from './certificate-template.types';

const PNG_SIGNATURE = Buffer.from('89504e470d0a1a0a', 'hex');
const PNG_IEND = Buffer.from('IEND', 'ascii');
const MAX_IMAGE_BYTES = 1024 * 1024;
const MAX_IMAGE_DIMENSION = 4096;
const MAX_IMAGE_PIXELS = 16_777_216;
const DEFAULT_LOCK_ID = 2026093001;

type TemplateAssetInput = CertificateLogoDto | CertificateSignatureDto;

@Injectable()
export class CertificateTemplatesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(CertificateTemplate)
    private readonly templatesRepository: Repository<CertificateTemplate>,
  ) {}

  async list() {
    const templates = await this.templatesRepository.find({
      relations: { assets: true },
      order: { is_default: 'DESC', created_at: 'ASC' },
    });
    return templates.map((template) => this.serialize(template));
  }

  create(input: CreateCertificateTemplateDto) {
    this.validateInput(input);
    return this.dataSource.transaction(async (manager) => {
      await this.lockDefault(manager);
      const repository = manager.getRepository(CertificateTemplate);
      const hasDefault = await repository.existsBy({ is_default: true });
      const template = await repository.save(
        repository.create({
          ...this.fields(input),
          client_reference: null,
          is_default: !hasDefault,
        }),
      );
      template.assets = await this.replaceAssets(manager, template.id, input);
      return this.serialize(template);
    });
  }

  update(id: string, input: CreateCertificateTemplateDto) {
    this.validateInput(input);
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(CertificateTemplate);
      const template = await repository.findOneBy({ id });
      if (!template) throw new NotFoundException('Modelo não encontrado.');
      repository.merge(template, this.fields(input));
      await repository.save(template);
      template.assets = await this.replaceAssets(manager, id, input);
      return this.serialize(template);
    });
  }

  setDefault(id: string) {
    return this.dataSource.transaction(async (manager) => {
      await this.lockDefault(manager);
      const repository = manager.getRepository(CertificateTemplate);
      const template = await repository.findOneBy({ id });
      if (!template) throw new NotFoundException('Modelo não encontrado.');
      await repository
        .createQueryBuilder()
        .update(CertificateTemplate)
        .set({ is_default: false })
        .where('is_default = TRUE')
        .execute();
      template.is_default = true;
      await repository.save(template);
      template.assets = await manager
        .getRepository(CertificateTemplateAsset)
        .find({
          where: { id_modelo: id },
          order: { kind: 'ASC', ordem: 'ASC' },
        });
      return this.serialize(template);
    });
  }

  sync(input: SyncCertificateTemplatesDto) {
    input.templates.forEach((template) => this.validateInput(template));
    return this.dataSource.transaction(async (manager) => {
      await this.lockDefault(manager);
      const repository = manager.getRepository(CertificateTemplate);
      const references = input.templates.map((template) => template.clientId);
      const existing = references.length
        ? await repository.findBy({ client_reference: In(references) })
        : [];
      const existingReferences = new Set(
        existing.map((template) => template.client_reference),
      );
      let hasDefault = await repository.existsBy({ is_default: true });
      const preferredDefault =
        input.templates.find((template) => template.isDefault) ??
        input.templates[0];
      if (preferredDefault && !hasDefault) {
        const existingPreferred = existing.find(
          (template) => template.client_reference === preferredDefault.clientId,
        );
        if (existingPreferred) {
          existingPreferred.is_default = true;
          await repository.save(existingPreferred);
          hasDefault = true;
        }
      }
      const fallbackDefaultReference = hasDefault
        ? null
        : (preferredDefault?.clientId ??
          input.templates.find(
            (template) => !existingReferences.has(template.clientId),
          )?.clientId ??
          null);
      let imported = 0;
      for (const item of input.templates) {
        if (existingReferences.has(item.clientId)) continue;
        const template = await repository.save(
          repository.create({
            ...this.fields(item),
            client_reference: item.clientId,
            is_default:
              !hasDefault && item.clientId === fallbackDefaultReference,
          }),
        );
        await this.replaceAssets(manager, template.id, item);
        existingReferences.add(item.clientId);
        hasDefault ||= template.is_default;
        imported += 1;
      }
      return { imported, skipped: input.templates.length - imported };
    });
  }

  async getDefaultSnapshot(manager: EntityManager) {
    const template = await manager.getRepository(CertificateTemplate).findOne({
      where: { is_default: true },
      relations: { assets: true },
    });
    if (!template) {
      return { snapshot: { ...LEGACY_CERTIFICATE_TEMPLATE }, assets: [] };
    }
    const snapshot: CertificateTemplateSnapshot = {
      templateId: template.id,
      name: template.name,
      eyebrow: template.eyebrow,
      title: template.title,
      body: template.body,
      signature: template.signature,
      primaryColor: template.primary_color,
      accentColor: template.accent_color,
    };
    return {
      snapshot,
      assets: [...(template.assets ?? [])].sort(
        (left, right) => left.ordem - right.ordem,
      ),
    };
  }

  private fields(input: CreateCertificateTemplateDto) {
    return {
      name: input.name.trim(),
      eyebrow: input.eyebrow.trim(),
      title: input.title.trim(),
      body: input.body.trim(),
      signature: input.signature.trim(),
      primary_color: input.primaryColor.toUpperCase(),
      accent_color: input.accentColor.toUpperCase(),
    };
  }

  private validateInput(input: CreateCertificateTemplateDto) {
    const requiredTexts = [
      input.name,
      input.eyebrow,
      input.title,
      input.body,
      input.signature,
    ];
    if (requiredTexts.some((value) => !value.trim())) {
      throw new BadRequestException(
        'Os campos de texto obrigatórios não podem conter apenas espaços.',
      );
    }
    const markers = [...input.body.matchAll(/\{([^{}]+)\}/g)].map(
      (match) => match[1],
    );
    const invalidMarker = markers.find(
      (marker) => marker !== 'aluno' && marker !== 'curso',
    );
    if (invalidMarker) {
      throw new BadRequestException(
        `Marcador não permitido: {${invalidMarker}}.`,
      );
    }
    const bodyWithoutAllowedMarkers = input.body
      .replaceAll('{aluno}', '')
      .replaceAll('{curso}', '');
    if (/[{}]/.test(bodyWithoutAllowedMarkers)) {
      throw new BadRequestException(
        'O texto contém um marcador incompleto ou não permitido.',
      );
    }
    input.logos.forEach((asset) => {
      if (!asset.name.trim()) {
        throw new BadRequestException('Informe o nome de todas as imagens.');
      }
      this.decodePng(asset.src);
    });
    input.signatures.forEach((asset) => {
      if (!asset.name.trim() || !asset.identification.trim()) {
        throw new BadRequestException('Identifique todas as assinaturas.');
      }
      this.decodePng(asset.src);
    });
  }

  private async replaceAssets(
    manager: EntityManager,
    templateId: string,
    input: CreateCertificateTemplateDto,
  ) {
    const repository = manager.getRepository(CertificateTemplateAsset);
    await repository.delete({ id_modelo: templateId });
    const assets = [
      ...this.createAssets(repository, templateId, 'logo', input.logos),
      ...this.createAssets(
        repository,
        templateId,
        'signature',
        input.signatures,
      ),
    ];
    return assets.length ? repository.save(assets) : [];
  }

  private createAssets(
    repository: Repository<CertificateTemplateAsset>,
    templateId: string,
    kind: CertificateAssetKind,
    inputs: TemplateAssetInput[],
  ) {
    return inputs.map((input, index) =>
      repository.create({
        id_modelo: templateId,
        kind,
        name: input.name.trim(),
        png_data: this.decodePng(input.src),
        identification:
          kind === 'signature'
            ? (input as CertificateSignatureDto).identification.trim()
            : null,
        ordem: index + 1,
      }),
    );
  }

  private decodePng(source: string) {
    const encoded = source.split(',', 2)[1] ?? '';
    const data = Buffer.from(encoded, 'base64');
    const width = data.length >= 24 ? data.readUInt32BE(16) : 0;
    const height = data.length >= 24 ? data.readUInt32BE(20) : 0;
    if (
      data.length === 0 ||
      data.length > MAX_IMAGE_BYTES ||
      data.length < 33 ||
      !data.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE) ||
      data.readUInt32BE(8) !== 13 ||
      data.subarray(12, 16).toString('ascii') !== 'IHDR' ||
      width === 0 ||
      height === 0 ||
      width > MAX_IMAGE_DIMENSION ||
      height > MAX_IMAGE_DIMENSION ||
      width * height > MAX_IMAGE_PIXELS ||
      data.indexOf(PNG_IEND, 24) < 0
    ) {
      throw new BadRequestException(
        'Cada imagem deve ser um PNG válido de até 1 MB.',
      );
    }
    return data;
  }

  private serialize(template: CertificateTemplate) {
    const assets = [...(template.assets ?? [])].sort(
      (left, right) => left.ordem - right.ordem,
    );
    const toImage = (asset: CertificateTemplateAsset) => ({
      name: asset.name,
      src: `data:image/png;base64,${asset.png_data.toString('base64')}`,
    });
    return {
      id: template.id,
      name: template.name,
      eyebrow: template.eyebrow,
      title: template.title,
      body: template.body,
      signature: template.signature,
      primaryColor: template.primary_color,
      accentColor: template.accent_color,
      isDefault: template.is_default,
      logos: assets.filter((asset) => asset.kind === 'logo').map(toImage),
      signatures: assets
        .filter((asset) => asset.kind === 'signature')
        .map((asset) => ({
          ...toImage(asset),
          identification: asset.identification ?? '',
        })),
    };
  }

  private lockDefault(manager: EntityManager) {
    return manager.query('SELECT pg_advisory_xact_lock($1)', [DEFAULT_LOCK_ID]);
  }
}
