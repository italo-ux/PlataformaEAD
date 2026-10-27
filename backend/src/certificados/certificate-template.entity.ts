import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { CertificateAssetKind } from './certificate-template.types';

@Entity('modelos_certificado')
export class CertificateTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  client_reference!: string | null;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 180 })
  eyebrow!: string;

  @Column({ type: 'varchar', length: 180 })
  title!: string;

  @Column({ type: 'varchar', length: 1000 })
  body!: string;

  @Column({ type: 'varchar', length: 180 })
  signature!: string;

  @Column({ type: 'char', length: 7 })
  primary_color!: string;

  @Column({ type: 'char', length: 7 })
  accent_color!: string;

  @Column({ type: 'boolean', default: false })
  is_default!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @OneToMany(() => CertificateTemplateAsset, (asset) => asset.template, {
    cascade: false,
  })
  assets!: CertificateTemplateAsset[];
}

@Entity('modelo_certificado_imagens')
export class CertificateTemplateAsset {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  id_modelo!: string;

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

  @ManyToOne(() => CertificateTemplate, (template) => template.assets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_modelo' })
  template!: CertificateTemplate;
}
