import { Entity, PrimaryGeneratedColumn, JoinColumn, OneToOne } from "typeorm";
import { ApiUser } from "./ApiUser";

@Entity()
export class Admin {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(type => ApiUser)
  @JoinColumn()
  user: ApiUser;
}
