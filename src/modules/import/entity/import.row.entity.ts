import { Column, Entity } from "typeorm";
import { BaseEntity } from "../../../common/entities/base.entity";

@Entity({name: 'importRow'})
export class ImportRowEntity extends BaseEntity {
  @Column({ type: 'int' })
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  date: string;
}