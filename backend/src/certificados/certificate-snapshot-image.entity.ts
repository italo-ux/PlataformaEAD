import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Certificado } from './certificado.entity';
import type { CertificateAssetKind } from './certificate-template.types';

@Entity('certificado_imagens_snapshot')
export class CertificateSnapshotImage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  id_certificado!: string;

  @Column({ type: 'varchar', length: 20 })
  kind!: CertificateAssetKind;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'bytea' })
  png_data!: Buffer;

  @Column({ type: 'varchar', length: 150, nullable: true })
  identification!: string | null;

  @Column({ type: 'integer' })
  ordem!: number;

  @ManyToOne(() => Certificado, (certificate) => certificate.snapshot_images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_certificado' })
  certificate!: Certificado;
}
