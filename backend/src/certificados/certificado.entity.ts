import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Matricula } from '../jornada/matricula.entity';
import type { CertificateTemplateSnapshot } from './certificate-template.types';
import { CertificateSnapshotImage } from './certificate-snapshot-image.entity';

export enum CertificadoStatus {
  VALIDO = 'valido',
  REVOGADO = 'revogado',
}

@Entity('certificados')
export class Certificado {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', unique: true })
  id_matricula!: string;

  @Column({ type: 'varchar', length: 40, unique: true })
  codigo!: string;

  @Column({ type: 'varchar', length: 255 })
  nome_aluno!: string;

  @Column({ type: 'varchar', length: 255 })
  nome_curso!: string;

  @Column({ type: 'integer' })
  carga_horaria!: number;

  @Column({ type: 'timestamptz' })
  concluido_em!: Date;

  @Column({
    type: 'enum',
    enum: CertificadoStatus,
    enumName: 'certificado_status',
    default: CertificadoStatus.VALIDO,
  })
  status!: CertificadoStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  emitido_em!: Date;

  @Column({ type: 'jsonb', nullable: true })
  modelo_snapshot!: CertificateTemplateSnapshot | null;

  @OneToOne(() => Matricula, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_matricula' })
  matricula!: Matricula;

  @OneToMany(() => CertificateSnapshotImage, (image) => image.certificate)
  snapshot_images!: CertificateSnapshotImage[];
}
