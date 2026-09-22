import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { Aula, AulaTipo } from './aula.entity';
import {
  AlternativaQuestionario,
  PerguntaQuestionario,
  Questionario,
} from './questionario.entity';
import { CursosService } from './cursos.service';
import { CreateAulaDto } from './dto/create-aula.dto';
import { UpdateAulaDto } from './dto/update-aula.dto';
import { Matricula } from '../jornada/matricula.entity';
import { extractYoutubeVideoId } from './youtube-video.util';
import { QUIZ_MAX_ATTEMPTS, QUIZ_PASS_PERCENTAGE } from './quiz-policy';
import { Curso, CursoStatus } from './curso.entity';
import { YoutubeVideoValidationService } from './youtube-video-validation.service';

@Injectable()
export class AulasService {
  constructor(
    @InjectRepository(Aula)
    private readonly aulasRepository: Repository<Aula>,
    @InjectRepository(Matricula)
    private readonly matriculasRepository: Repository<Matricula>,
    private readonly cursosService: CursosService,
    private readonly dataSource?: DataSource,
    private readonly youtubeValidation?: YoutubeVideoValidationService,
  ) {}

  async create(
    cursoId: string,
    createAulaDto: CreateAulaDto,
    actor: AuthenticatedUser,
  ) {
    const curso = await this.cursosService.findManageable(cursoId, actor);
    this.ensureCourseIsDraft(curso);
    await this.ensureCourseStructureIsEditable(cursoId);

    const ordem =
      (await this.aulasRepository.count({
        where: { curso: { id: cursoId } },
      })) + 1;
    const tipo = createAulaDto.tipo ?? AulaTipo.VIDEO;
    this.validateContent(tipo, createAulaDto);
    if (tipo === AulaTipo.VIDEO) {
      const duration = createAulaDto.duracao_segundos!;
      const aula = this.aulasRepository.create({
        ...createAulaDto,
        tipo,
        ordem,
        curso,
        id_instrutor: curso.id_instrutor,
        youtube_video_id: this.requireYoutubeVideoId(createAulaDto.url_video!),
        duracao_minutos: Math.ceil(duration / 60),
        youtube_embeddable: null,
        youtube_validado_em: null,
      });
      return this.aulasRepository.save(aula);
    }
    return this.dataSource!.transaction(async (manager) => {
      const { questionario: questionarioInput, ...lessonInput } = createAulaDto;
      const aula = await manager.save(
        manager.create(Aula, {
          ...lessonInput,
          tipo,
          url_video: null,
          ordem,
          curso,
          id_instrutor: curso.id_instrutor,
          youtube_video_id: null,
          duracao_minutos: null,
          duracao_segundos: null,
          youtube_embeddable: null,
          youtube_validado_em: null,
        }),
      );
      if (tipo === AulaTipo.QUESTIONARIO && questionarioInput) {
        await this.saveQuestionario(manager, aula, questionarioInput);
      }
      return this.findOneWith(manager.getRepository(Aula), cursoId, aula.id);
    });
  }

  async findAll(cursoId: string, actor: AuthenticatedUser) {
    await this.cursosService.findManageable(cursoId, actor);
    return this.aulasRepository.find({
      where: { curso: { id: cursoId } },
      relations: { questionario: { perguntas: { alternativas: true } } },
      order: { ordem: 'ASC', titulo: 'ASC' },
    });
  }

  async reorder(
    cursoId: string,
    lessonIds: string[],
    actor: AuthenticatedUser,
  ) {
    const curso = await this.cursosService.findManageable(cursoId, actor);
    this.ensureCourseIsDraft(curso);
    await this.ensureCourseStructureIsEditable(cursoId);
    const lessons = await this.aulasRepository.find({
      where: { curso: { id: cursoId } },
      order: { ordem: 'ASC', titulo: 'ASC' },
    });
    if (
      lessonIds.length !== lessons.length ||
      lessons.some((lesson) => !lessonIds.includes(lesson.id))
    ) {
      throw new BadRequestException(
        'A nova ordem deve conter todas as aulas do curso uma única vez.',
      );
    }
    const byId = new Map(lessons.map((lesson) => [lesson.id, lesson]));
    await this.aulasRepository.save(
      lessonIds.map((id, index) => ({ ...byId.get(id)!, ordem: index + 1 })),
    );
    return this.findAll(cursoId, actor);
  }

  async findOne(cursoId: string, aulaId: string) {
    const aula = await this.aulasRepository.findOne({
      where: { id: aulaId, curso: { id: cursoId } },
      relations: { questionario: { perguntas: { alternativas: true } } },
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
    const curso = await this.cursosService.findManageable(cursoId, actor);
    this.ensureCourseIsDraft(curso);
    await this.ensureCourseStructureIsEditable(cursoId);
    const aula = await this.findOne(cursoId, aulaId);
    const tipo = updateAulaDto.tipo ?? aula.tipo ?? AulaTipo.VIDEO;
    if (
      tipo === AulaTipo.VIDEO &&
      updateAulaDto.url_video &&
      updateAulaDto.duracao_segundos === undefined
    ) {
      throw new BadRequestException(
        'Informe a duração em segundos ao alterar o vídeo.',
      );
    }
    if (
      updateAulaDto.tipo !== undefined ||
      updateAulaDto.url_video !== undefined ||
      updateAulaDto.duracao_segundos !== undefined ||
      updateAulaDto.questionario !== undefined
    ) {
      this.validateContent(tipo, { ...aula, ...updateAulaDto });
    }
    const duration = updateAulaDto.duracao_segundos ?? aula.duracao_segundos;
    const videoId =
      tipo === AulaTipo.VIDEO && updateAulaDto.url_video
        ? this.requireYoutubeVideoId(updateAulaDto.url_video)
        : tipo === AulaTipo.VIDEO
          ? aula.youtube_video_id
          : null;
    if (tipo === AulaTipo.VIDEO && !updateAulaDto.questionario) {
      return this.aulasRepository.save(
        this.aulasRepository.merge(aula, updateAulaDto, {
          tipo,
          youtube_video_id: videoId,
          ...(duration ? { duracao_minutos: Math.ceil(duration / 60) } : {}),
          ...(updateAulaDto.url_video
            ? { youtube_embeddable: null, youtube_validado_em: null }
            : {}),
        }),
      );
    }
    return this.dataSource!.transaction(async (manager) => {
      const { questionario: questionarioInput, ...lessonInput } = updateAulaDto;
      const saved = await manager.save(
        manager.getRepository(Aula).merge(aula, lessonInput, {
          tipo,
          url_video:
            tipo === AulaTipo.VIDEO
              ? (lessonInput.url_video ?? aula.url_video)
              : null,
          youtube_video_id: videoId,
          duracao_segundos: tipo === AulaTipo.VIDEO ? duration : null,
          duracao_minutos:
            tipo === AulaTipo.VIDEO && duration
              ? Math.ceil(duration / 60)
              : null,
          ...(lessonInput.url_video
            ? { youtube_embeddable: null, youtube_validado_em: null }
            : {}),
        }),
      );
      if (questionarioInput) {
        if (aula.questionario)
          await manager.delete(Questionario, aula.questionario.id);
        await this.saveQuestionario(manager, saved, questionarioInput);
      }
      return this.findOneWith(manager.getRepository(Aula), cursoId, saved.id);
    });
  }

  async remove(cursoId: string, aulaId: string, actor: AuthenticatedUser) {
    const curso = await this.cursosService.findManageable(cursoId, actor);
    this.ensureCourseIsDraft(curso);
    await this.ensureCourseStructureIsEditable(cursoId);
    const aula = await this.findOne(cursoId, aulaId);
    await this.aulasRepository.remove(aula);
  }

  async repairUnavailableVideo(
    cursoId: string,
    aulaId: string,
    videoUrl: string,
    actor: AuthenticatedUser,
  ) {
    const curso = await this.cursosService.findManageable(cursoId, actor);
    if (curso.status !== CursoStatus.PUBLICADO) {
      throw new ConflictException(
        'Use a edição normal enquanto o curso estiver em rascunho.',
      );
    }

    const aula = await this.findOne(cursoId, aulaId);
    if (
      aula.tipo !== AulaTipo.VIDEO ||
      aula.youtube_embeddable !== false
    ) {
      throw new ConflictException(
        'Somente vídeos indisponíveis de cursos publicados podem ser reparados.',
      );
    }

    const videoId = this.requireYoutubeVideoId(videoUrl);
    const available = await this.youtubeValidation!.validateVideo(videoId);
    if (!available) {
      throw new ConflictException(
        'O novo vídeo foi removido, é privado ou não permite incorporação.',
      );
    }

    aula.url_video = videoUrl;
    aula.youtube_video_id = videoId;
    aula.youtube_embeddable = true;
    aula.youtube_validado_em = new Date();
    return this.aulasRepository.save(aula);
  }

  private ensureCourseIsDraft(course: Curso) {
    if (course.status !== CursoStatus.RASCUNHO) {
      throw new ConflictException(
        'Cursos publicados não podem ser editados. Se um vídeo estiver indisponível, altere somente a URL pelo modo de reparo.',
      );
    }
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

  private validateContent(
    tipo: AulaTipo,
    input: {
      url_video?: string | null;
      duracao_segundos?: number | null;
      questionario?: CreateAulaDto['questionario'] | Questionario | null;
    },
  ) {
    if (tipo === AulaTipo.VIDEO) {
      if (!input.url_video || !input.duracao_segundos) {
        throw new BadRequestException(
          'A aula em vídeo exige URL do YouTube e duração.',
        );
      }
      this.requireYoutubeVideoId(input.url_video);
      return;
    }
    if (tipo !== AulaTipo.QUESTIONARIO || !input.questionario) {
      throw new BadRequestException(
        'O tipo de conteúdo informado ainda não está disponível.',
      );
    }
    for (const [index, pergunta] of input.questionario.perguntas.entries()) {
      if (pergunta.alternativas.filter((item) => item.correta).length !== 1) {
        throw new BadRequestException(
          `A pergunta ${index + 1} deve possuir exatamente uma alternativa correta.`,
        );
      }
    }
  }

  private async saveQuestionario(
    manager: import('typeorm').EntityManager,
    aula: Aula,
    input: NonNullable<CreateAulaDto['questionario']>,
  ) {
    const questionario = await manager.save(
      manager.create(Questionario, {
        id_aula: aula.id,
        nota_minima: QUIZ_PASS_PERCENTAGE,
        max_tentativas: QUIZ_MAX_ATTEMPTS,
        pontos_base: input.pontos_base ?? 0,
      }),
    );
    for (const [questionIndex, questionInput] of input.perguntas.entries()) {
      const pergunta = await manager.save(
        manager.create(PerguntaQuestionario, {
          id_questionario: questionario.id,
          enunciado: questionInput.enunciado.trim(),
          ordem: questionIndex + 1,
          pontos: questionInput.pontos,
        }),
      );
      await manager.save(
        AlternativaQuestionario,
        questionInput.alternativas.map((alternative, alternativeIndex) =>
          manager.create(AlternativaQuestionario, {
            id_pergunta: pergunta.id,
            texto: alternative.texto.trim(),
            ordem: alternativeIndex + 1,
            correta: alternative.correta,
          }),
        ),
      );
    }
  }

  private async findOneWith(
    repository: Repository<Aula>,
    cursoId: string,
    aulaId: string,
  ) {
    return repository.findOneOrFail({
      where: { id: aulaId, curso: { id: cursoId } },
      relations: { questionario: { perguntas: { alternativas: true } } },
    });
  }
}
