import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { Aula } from './aula.entity';

@Entity('aula_pdfs')
export class AulaPdf {
  @PrimaryColumn({ type: 'uuid' })
  id_aula!: string;

  @Column({ type: 'varchar', length: 255 })
  nome_arquivo!: string;

  @Column({ type: 'integer' })
  tamanho_bytes!: number;

  @Column({ type: 'bytea', select: false })
  conteudo!: Buffer;

  @OneToOne(() => Aula, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'id_aula' })
  aula!: Aula;
}
