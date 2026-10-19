import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Aula } from './aula.entity';

export enum CursoStatus {
  RASCUNHO = 'rascunho',
  PUBLICADO = 'publicado',
}

@Entity('cursos')
export class Curso {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  nome!: string;

  @Column({ type: 'text', nullable: true })
  descricao!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  url_foto!: string | null;

  @Column({ type: 'integer', nullable: true })
  carga_horaria!: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  categoria!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nivel!: string | null;

  @Column({ type: 'uuid' })
  id_instrutor!: string;

  @Column({
    type: 'enum',
    enum: CursoStatus,
    enumName: 'curso_status',
    default: CursoStatus.RASCUNHO,
  })
  status!: CursoStatus;

  @Column({ type: 'timestamptz', nullable: true })
  publicado_em!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @OneToMany(() => Aula, (aula) => aula.curso)
  aulas!: Aula[];
}
