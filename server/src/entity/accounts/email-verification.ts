import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn
} from "typeorm";
import { LocalUser } from "./local-user";

@Entity()
export class EmailVerification {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @OneToOne(type => LocalUser)
  @JoinColumn()
  user: LocalUser;

  @Column()
  email: string;

  @Column()
  verified: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
