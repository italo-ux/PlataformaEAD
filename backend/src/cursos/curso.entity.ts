import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Aula } from './aula.entity';

@Entity('cursos')
export class Curso {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  nome!: string;

  @Column({ type: 'text', nullable: true })
  descricao!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  url_foto!: string | null;

  @Column({ type: 'integer', nullable: true })
  carga_horaria!: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  categoria!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nivel!: string | null;

  @OneToMany(() => Aula, (aula) => aula.curso)
  aulas!: Aula[];
}
