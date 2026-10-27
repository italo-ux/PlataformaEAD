import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Aula } from './aula.entity';
import { Matricula } from '../jornada/matricula.entity';
import { QUIZ_MAX_ATTEMPTS, QUIZ_PASS_PERCENTAGE } from './quiz-policy';

@Entity('questionarios')
@Check('CHK_questionario_nota_minima', `nota_minima = ${QUIZ_PASS_PERCENTAGE}`)
@Check(
  'CHK_questionario_max_tentativas',
  `max_tentativas = ${QUIZ_MAX_ATTEMPTS}`,
)
export class Questionario {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', unique: true }) id_aula!: string;
  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: QUIZ_PASS_PERCENTAGE,
  })
  nota_minima!: number;
  @Column({ type: 'integer', default: QUIZ_MAX_ATTEMPTS })
  max_tentativas!: number;
  @Column({ type: 'integer', default: 0 }) pontos_base!: number;
  @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updated_at!: Date;

  @OneToOne(() => Aula, (aula) => aula.questionario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_aula' })
  aula!: Aula;

  @OneToMany(() => PerguntaQuestionario, (pergunta) => pergunta.questionario, {
    cascade: true,
  })
  perguntas!: PerguntaQuestionario[];
}

@Entity('perguntas_questionario')
@Unique('UQ_pergunta_questionario_ordem', ['id_questionario', 'ordem'])
export class PerguntaQuestionario {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid' }) id_questionario!: string;
  @Column({ type: 'text' }) enunciado!: string;
  @Column({ type: 'integer' }) ordem!: number;
  @Column({ type: 'integer', default: 1 }) pontos!: number;

  @ManyToOne(() => Questionario, (questionario) => questionario.perguntas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_questionario' })
  questionario!: Questionario;

  @OneToMany(
    () => AlternativaQuestionario,
    (alternativa) => alternativa.pergunta,
    {
      cascade: true,
    },
  )
  alternativas!: AlternativaQuestionario[];
}

@Entity('alternativas_questionario')
@Unique('UQ_alternativa_pergunta_ordem', ['id_pergunta', 'ordem'])
export class AlternativaQuestionario {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid' }) id_pergunta!: string;
  @Column({ type: 'text' }) texto!: string;
  @Column({ type: 'integer' }) ordem!: number;
  @Column({ type: 'boolean', default: false }) correta!: boolean;

  @ManyToOne(() => PerguntaQuestionario, (pergunta) => pergunta.alternativas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_pergunta' })
  pergunta!: PerguntaQuestionario;
}

@Entity('tentativas_questionario')
@Unique('UQ_tentativa_numero', ['id_questionario', 'id_matricula', 'numero'])
export class TentativaQuestionario {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid' }) id_questionario!: string;
  @Column({ type: 'uuid' }) id_matricula!: string;
  @Column({ type: 'integer' }) numero!: number;
  @Column({ type: 'integer' }) acertos!: number;
  @Column({ type: 'integer' }) total_perguntas!: number;
  @Column({ type: 'integer', default: 0 }) pontos_obtidos!: number;
  @Column({ type: 'integer', default: 0 }) pontos_possiveis!: number;
  @Column({ type: 'numeric', precision: 5, scale: 2 }) percentual!: number;
  @Column({ type: 'boolean' }) aprovado!: boolean;
  @CreateDateColumn({ type: 'timestamptz' }) concluida_em!: Date;

  @ManyToOne(() => Questionario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_questionario' })
  questionario!: Questionario;
  @ManyToOne(() => Matricula, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_matricula' })
  matricula!: Matricula;
  @OneToMany(() => RespostaQuestionario, (resposta) => resposta.tentativa, {
    cascade: true,
  })
  respostas!: RespostaQuestionario[];
}

@Entity('respostas_questionario')
@Unique('UQ_resposta_tentativa_pergunta', ['id_tentativa', 'id_pergunta'])
export class RespostaQuestionario {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid' }) id_tentativa!: string;
  @Column({ type: 'uuid' }) id_pergunta!: string;
  @Column({ type: 'uuid' }) id_alternativa!: string;
  @Column({ type: 'boolean' }) correta!: boolean;
  @Column({ type: 'integer', default: 0 }) pontos_obtidos!: number;

  @ManyToOne(() => TentativaQuestionario, (tentativa) => tentativa.respostas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_tentativa' })
  tentativa!: TentativaQuestionario;
  @ManyToOne(() => PerguntaQuestionario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_pergunta' })
  pergunta!: PerguntaQuestionario;
  @ManyToOne(() => AlternativaQuestionario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_alternativa' })
  alternativa!: AlternativaQuestionario;
}
