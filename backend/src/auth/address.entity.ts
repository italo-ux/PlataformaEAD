import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('endereco')
@Index('UQ_endereco_id_usuario', ['id_usuario'], { unique: true })
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  id_usuario!: string;

  @Column({ type: 'varchar', length: 8 })
  cep!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  rua!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  bairro!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cidade!: string | null;

  @Column({ type: 'char', length: 2, nullable: true })
  uf!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  estado!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  complemento!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
