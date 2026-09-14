import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { Aula } from './aula.entity';
import { CursosService } from './cursos.service';
import { CreateAulaDto } from './dto/create-aula.dto';
import { UpdateAulaDto } from './dto/update-aula.dto';
import { Matricula } from '../jornada/matricula.entity';
import { extractYoutubeVideoId } from './youtube-video.util';

@Injectable()
export class AulasService {
  constructor(
    @InjectRepository(Aula)
    private readonly aulasRepository: Repository<Aula>,
    @InjectRepository(Matricula)
    private readonly matriculasRepository: Repository<Matricula>,
    private readonly cursosService: CursosService,
  ) {}

  async create(
    cursoId: string,
    createAulaDto: CreateAulaDto,
    actor: AuthenticatedUser,
  ) {
    const curso = await this.cursosService.findManageable(cursoId, actor);
    await this.ensureCourseStructureIsEditable(cursoId);

    const ordem =
      createAulaDto.ordem ??
      (await this.aulasRepository.count({
        where: { curso: { id: cursoId } },
      })) + 1;
    const videoId = this.requireYoutubeVideoId(createAulaDto.url_video);
    const aula = this.aulasRepository.create({
      ...createAulaDto,
      ordem,
      curso,
      id_instrutor: curso.id_instrutor,
      youtube_video_id: videoId,
      duracao_minutos: Math.ceil(createAulaDto.duracao_segundos / 60),
      youtube_embeddable: null,
      youtube_validado_em: null,
    });
    return this.aulasRepository.save(aula);
  }

  findAll(cursoId: string) {
    return this.aulasRepository.find({
      where: { curso: { id: cursoId } },
      order: { ordem: 'ASC', titulo: 'ASC' },
    });
  }

  async findOne(cursoId: string, aulaId: string) {
    const aula = await this.aulasRepository.findOne({
      where: { id: aulaId, curso: { id: cursoId } },
    });
    if (!aula) throw new NotFoundException('Aula não encontrada');
    return aula;
  }

  async update(
    cursoId: string,
    aulaId: string,
    updateAulaDto: UpdateAulaDto,
    actor: AuthenticatedUser,
  ) {
    await this.cursosService.findManageable(cursoId, actor);
    await this.ensureCourseStructureIsEditable(cursoId);
    const aula = await this.findOne(cursoId, aulaId);
    if (
      updateAulaDto.url_video &&
      updateAulaDto.duracao_segundos === undefined
    ) {
      throw new BadRequestException(
        'Informe a duração em segundos ao alterar o vídeo.',
      );
    }
    const duration = updateAulaDto.duracao_segundos ?? aula.duracao_segundos;
    const videoId = updateAulaDto.url_video
      ? this.requireYoutubeVideoId(updateAulaDto.url_video)
      : aula.youtube_video_id;
    return this.aulasRepository.save(
      this.aulasRepository.merge(aula, updateAulaDto, {
        youtube_video_id: videoId,
        ...(duration
          ? {
              duracao_minutos: Math.ceil(duration / 60),
            }
          : {}),
        ...(updateAulaDto.url_video
          ? { youtube_embeddable: null, youtube_validado_em: null }
          : {}),
      }),
    );
  }

  async remove(cursoId: string, aulaId: string, actor: AuthenticatedUser) {
    await this.cursosService.findManageable(cursoId, actor);
    await this.ensureCourseStructureIsEditable(cursoId);
    const aula = await this.findOne(cursoId, aulaId);
    await this.aulasRepository.remove(aula);
  }

  private async ensureCourseStructureIsEditable(courseId: string) {
    if (await this.matriculasRepository.existsBy({ id_curso: courseId })) {
      throw new ConflictException(
        'A estrutura de um curso com matrículas não pode ser alterada.',
      );
    }
  }

  private requireYoutubeVideoId(videoUrl: string) {
    const videoId = extractYoutubeVideoId(videoUrl);
    if (!videoId) {
      throw new BadRequestException(
        'A aula deve conter uma URL válida de vídeo do YouTube.',
      );
    }
    return videoId;
  }
}
