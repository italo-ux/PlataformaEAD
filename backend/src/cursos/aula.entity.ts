import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Curso } from './curso.entity';

@Entity('aulas')
export class Aula {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Curso, (curso) => curso.aulas, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_curso' })
  curso!: Curso;

  @Column({ type: 'uuid' })
  id_instrutor!: string;

  @Column({ type: 'varchar', length: 255 })
  titulo!: string;

  @Column({ type: 'text', nullable: true })
  descricao!: string | null;

  @Column({ type: 'varchar', length: 500 })
  url_video!: string;

  @Column({ type: 'integer', nullable: true })
  duracao_minutos!: number | null;

  @Column({ type: 'integer' })
  ordem!: number;
}
