import { RowDto } from "./row.dto";
import { Expose, Type } from "class-transformer";

export class GroupedDataDto {
  @Expose()
  date: string;

  @Expose()
  @Type(() => RowDto)
  items: RowDto[];
}