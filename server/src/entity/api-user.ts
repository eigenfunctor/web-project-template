import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity()
export class ApiUser {
  @PrimaryColumn()
  provider: string;

  @PrimaryColumn()
  id: string;

  @Column()
  loggedName: string;

  @Column()
  loggedEmail: string;
}
