import { Entity, PrimaryGeneratedColumn, JoinColumn, OneToOne } from "typeorm";
import { ApiUser } from "./api-user";

@Entity()
export class Admin {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(type => ApiUser)
  @JoinColumn()
  user: ApiUser;
}
