/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await */
import { DataSource, Repository } from 'typeorm';
import {
  CertificateTemplate,
  CertificateTemplateAsset,
} from './certificate-template.entity';
import { CertificateTemplatesService } from './certificate-templates.service';

const png = Buffer.concat([
  Buffer.from('89504e470d0a1a0a0000000d494844520000000100000001', 'hex'),
  Buffer.alloc(16),
  Buffer.from('49454e44', 'hex'),
]);
const dataUrl = `data:image/png;base64,${png.toString('base64')}`;
const input = {
  name: 'Modelo seguro',
  eyebrow: 'Instituição',
  title: 'Certificado',
  body: '{aluno} concluiu {curso}.',
  signature: 'Coordenação',
  primaryColor: '#112233',
  accentColor: '#445566',
  logos: [{ name: 'logo.png', src: dataUrl }],
  signatures: [
    { name: 'assinatura.png', src: dataUrl, identification: 'Diretoria' },
  ],
};

describe('CertificateTemplatesService', () => {
  function setup(hasDefault = true) {
    const templates: CertificateTemplate[] = [];
    const assets: CertificateTemplateAsset[] = [];
    const updateBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({}),
    };
    const templateRepository = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => {
        const saved = {
          id: value.id ?? '11111111-1111-4111-8111-111111111111',
          created_at: new Date(),
          updated_at: new Date(),
          assets: value.assets ?? [],
          ...value,
        } as CertificateTemplate;
        const index = templates.findIndex((item) => item.id === saved.id);
        if (index >= 0) templates[index] = saved;
        else templates.push(saved);
        return saved;
      }),
      existsBy: jest.fn().mockResolvedValue(hasDefault),
      findOneBy: jest.fn(({ id }) =>
        Promise.resolve(templates.find((item) => item.id === id) ?? null),
      ),
      findBy: jest.fn().mockResolvedValue([]),
      merge: jest.fn((target, value) => Object.assign(target, value)),
      createQueryBuilder: jest.fn().mockReturnValue(updateBuilder),
    };
    const assetRepository = {
      delete: jest.fn().mockResolvedValue({}),
      create: jest.fn((value) => value),
      save: jest.fn(async (values) => {
        const saved = values.map((value, index) => ({
          id: `asset-${index}`,
          ...value,
        })) as CertificateTemplateAsset[];
        assets.push(...saved);
        return saved;
      }),
      find: jest
        .fn()
        .mockImplementation(({ where }) =>
          Promise.resolve(
            assets.filter((asset) => asset.id_modelo === where.id_modelo),
          ),
        ),
    };
    const manager = {
      query: jest.fn().mockResolvedValue([]),
      getRepository: jest.fn((entity) =>
        entity === CertificateTemplate ? templateRepository : assetRepository,
      ),
    };
    const dataSource = {
      transaction: jest.fn((work) => work(manager)),
    } as unknown as DataSource;
    const service = new CertificateTemplatesService(
      dataSource,
      templateRepository as unknown as Repository<CertificateTemplate>,
    );
    return {
      service,
      manager,
      templates,
      assets,
      templateRepository,
      assetRepository,
      updateBuilder,
    };
  }

  it('cria o modelo e persiste PNG como bytea, sem base64 no banco', async () => {
    const { service, manager, assets } = setup(false);

    await expect(service.create(input)).resolves.toMatchObject({
      name: input.name,
      isDefault: true,
      logos: [{ name: 'logo.png', src: dataUrl }],
    });
    expect(manager.query).toHaveBeenCalledWith(
      'SELECT pg_advisory_xact_lock($1)',
      [2026093001],
    );
    expect(Buffer.isBuffer(assets[0].png_data)).toBe(true);
    expect(assets[0].png_data.equals(png)).toBe(true);
  });

  it('troca o padrão sob lock transacional', async () => {
    const { service, templates, updateBuilder } = setup();
    templates.push({
      id: '22222222-2222-4222-8222-222222222222',
      is_default: false,
      assets: [],
    } as CertificateTemplate);

    await service.setDefault(templates[0].id);

    expect(updateBuilder.where).toHaveBeenCalledWith('is_default = TRUE');
    expect(templates[0].is_default).toBe(true);
  });

  it('sincroniza referências do navegador sem sobrescrever as existentes', async () => {
    const { service, templateRepository } = setup();
    templateRepository.findBy.mockResolvedValue([
      { client_reference: 'modelo-local' } as CertificateTemplate,
    ]);

    await expect(
      service.sync({
        templates: [{ ...input, clientId: 'modelo-local', isDefault: true }],
      }),
    ).resolves.toEqual({ imported: 0, skipped: 1 });
    expect(templateRepository.save).not.toHaveBeenCalled();
  });

  it('define um padrão ao importar para um banco que ainda não possui padrão', async () => {
    const { service, templates } = setup(false);

    await service.sync({
      templates: [{ ...input, clientId: 'modelo-local', isDefault: false }],
    });

    expect(templates).toHaveLength(1);
    expect(templates[0]).toMatchObject({
      client_reference: 'modelo-local',
      is_default: true,
    });
  });

  it.each([
    ['campos formados apenas por espaços', { ...input, name: '   ' }],
    [
      'marcador desconhecido',
      { ...input, body: '{aluno} concluiu {disciplina}.' },
    ],
    ['marcador incompleto', { ...input, body: '{aluno concluiu {curso}.' }],
    [
      'assinatura sem identificação',
      {
        ...input,
        signatures: [
          { name: 'assinatura.png', src: dataUrl, identification: '   ' },
        ],
      },
    ],
  ])('rejeita %s', async (_case, invalidInput) => {
    const { service } = setup();
    expect(() => service.create(invalidInput)).toThrow();
  });

  it('rejeita PNG com dimensão abusiva mesmo abaixo do limite de bytes', async () => {
    const oversized = Buffer.from(png);
    oversized.writeUInt32BE(5000, 16);
    const { service } = setup();

    expect(() =>
      service.create({
        ...input,
        logos: [
          {
            name: 'logo.png',
            src: `data:image/png;base64,${oversized.toString('base64')}`,
          },
        ],
      }),
    ).toThrow('PNG válido');
  });
});
