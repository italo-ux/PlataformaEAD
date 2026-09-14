import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProgressoAula } from './progresso-aula.entity';

export enum PlaybackSessionStatus {
  ACTIVE = 'ativa',
  ENDED = 'encerrada',
  EXPIRED = 'expirada',
  REVOKED = 'revogada',
}

export enum PlaybackState {
  PLAYING = 'playing',
  PAUSED = 'paused',
  ENDED = 'ended',
}

@Entity('sessao_reproducao')
export class PlaybackSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  id_progresso_aula!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: PlaybackSessionStatus.ACTIVE,
  })
  status!: PlaybackSessionStatus;

  @Column({ type: 'integer', default: 0 })
  sequencia!: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  ultima_posicao!: number;

  @Column({ type: 'varchar', length: 20, default: PlaybackState.PLAYING })
  ultimo_estado!: PlaybackState;

  @Column({ type: 'timestamptz' })
  ultimo_heartbeat_em!: Date;

  @Column({ type: 'timestamptz' })
  expira_em!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @ManyToOne(() => ProgressoAula, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_progresso_aula' })
  progresso!: ProgressoAula;
}
