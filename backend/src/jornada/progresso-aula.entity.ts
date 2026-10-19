import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Aula } from '../cursos/aula.entity';
import { Matricula } from './matricula.entity';

export type WatchedRange = [number, number];

@Entity('progresso_aula')
@Unique('UQ_progresso_aula_matricula_aula', ['id_matricula', 'id_aula'])
@Check('CHK_progresso_aula_percentual', 'percentual >= 0 AND percentual <= 100')
export class ProgressoAula {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  id_matricula!: string;

  @Column({ type: 'uuid' })
  id_aula!: string;

  @Column({ type: 'integer' })
  ordem_snapshot!: number;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  intervalos_assistidos!: WatchedRange[];

  @Column({ type: 'integer', nullable: true })
  duracao_segundos!: number | null;

  @Column({ type: 'integer', default: 0 })
  posicao_segundos!: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  percentual!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  tempo_reproducao_validado_segundos!: number;

  @Column({ type: 'boolean', default: false })
  concluida!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  concluida_em!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @ManyToOne(() => Matricula, (matricula) => matricula.aulas, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_matricula' })
  matricula!: Matricula;

  @ManyToOne(() => Aula, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_aula' })
  aula!: Aula;
}
