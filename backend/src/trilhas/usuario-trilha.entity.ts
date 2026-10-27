import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Trilha } from './trilha.entity';

@Entity('usuario_trilha')
export class UsuarioTrilha {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  id_usuario!: string;

  @Column({ type: 'uuid' })
  id_trilha!: string;

  @Column({ type: 'integer', default: 0 })
  progresso!: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'data_inicio' })
  data_inicio!: Date;

  @Column({ type: 'boolean', default: false })
  concluida!: boolean;

  @ManyToOne(() => Trilha)
  @JoinColumn({ name: 'id_trilha' })
  trilha!: Trilha;
}
