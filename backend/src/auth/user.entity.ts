import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'name' }) // Isso força o TypeORM a buscar exatamente 'name' minúsculo
  name!: string;
  @Column({ unique: true })
  email!: string;

  @Column()
  password_hash!: string;

  @Column({ default: false }) //cria uma coluna que começa como falso para a verificaçao do usuário - OTP
  is_verified!: boolean;

  @Column({ type: 'varchar', nullable: true }) //cria a tabela para o código de autenticação que será apagado depois - OTP
  verification_code!: string | null; //pode começar vazia também

  @Column({ nullable: true }) // Isso diz ao banco que tudo bem não mandar o CPF por enquanto
  cpf!: string;
}
