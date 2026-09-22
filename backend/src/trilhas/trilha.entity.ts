import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TrilhaCurso } from './trilha-curso.entity';

@Entity('trilhas')
export class Trilha {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  nome!: string;

  @Column({ type: 'text', nullable: true })
  descricao!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  capa!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nivel!: string | null;

  @Column({ type: 'varchar', length: 7, default: '#3f5fd8' })
  cor_fundo!: string;

  @OneToMany(() => TrilhaCurso, (vinculo) => vinculo.trilha)
  cursos!: TrilhaCurso[];
}
