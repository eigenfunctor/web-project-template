import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  OneToOne
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
  verified?: boolean;
}
