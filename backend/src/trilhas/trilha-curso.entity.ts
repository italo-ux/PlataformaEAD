import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Curso } from '../cursos/curso.entity';
import { Trilha } from './trilha.entity';

@Entity('trilha_curso')
export class TrilhaCurso {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  id_trilha!: string;

  @Column({ type: 'uuid' })
  id_curso!: string;

  @Column({ type: 'integer', nullable: true })
  ordem!: number | null;

  @ManyToOne(() => Trilha, (trilha) => trilha.cursos, { nullable: false })
  @JoinColumn({ name: 'id_trilha' })
  trilha!: Trilha;

  @ManyToOne(() => Curso, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_curso' })
  curso!: Curso;
}
