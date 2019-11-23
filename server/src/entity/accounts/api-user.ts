import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity()
export class ApiUser {
  @PrimaryColumn()
  provider: string;

  @PrimaryColumn()
  id: string;

  @Column({ nullable: true })
  loggedName: string;

  @Column({ nullable: true })
  loggedEmail: string;
}
