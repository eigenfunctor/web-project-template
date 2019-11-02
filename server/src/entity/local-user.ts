import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity()
export class LocalUser {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;
}
