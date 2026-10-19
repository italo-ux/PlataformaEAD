import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../auth/user.entity';
import { Aula } from '../cursos/aula.entity';
import { Curso } from '../cursos/curso.entity';
import { ProgressoAula } from './progresso-aula.entity';

@Entity('matricula')
@Unique('UQ_matricula_usuario_curso', ['id_usuario', 'id_curso'])
@Check('CHK_matricula_progresso', 'progresso >= 0 AND progresso <= 100')
export class Matricula {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  id_usuario!: string;

  @Column({ type: 'uuid' })
  id_curso!: string;

  @Column({ type: 'integer', default: 0 })
  progresso!: number;

  @Column({ type: 'boolean', default: false })
  conclusao!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  concluido_em!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  ultima_aula_id!: string | null;

  @Column({ type: 'integer', default: 0 })
  segundos_estudados!: number;

  @CreateDateColumn({ name: 'data_matricula', type: 'timestamptz' })
  data_matricula!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_usuario' })
  usuario!: User;

  @ManyToOne(() => Curso, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_curso' })
  curso!: Curso;

  @ManyToOne(() => Aula, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ultima_aula_id' })
  ultima_aula!: Aula | null;

  @OneToMany(() => ProgressoAula, (progresso) => progresso.matricula)
  aulas!: ProgressoAula[];
}
