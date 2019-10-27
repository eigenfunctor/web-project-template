import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  OneToOne
} from "typeorm";
import { LocalUser } from "./LocalUser";

@Entity()
export class EmailVerification {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @OneToOne(type => LocalUser)
  @JoinColumn()
  user: LocalUser;

  @Column({ nullable: true })
  verified?: boolean;
}
