import { IsInt, IsNotEmpty, IsNumber, IsString, Matches } from "class-validator";
import { Expose, Type } from "class-transformer";

export class RowDto {
  @Expose()
  @IsNotEmpty({ message: 'id is required' })
  @Type(() => Number)
  @IsNumber({}, { message: 'id must be a number' })
  id: number;

  @Expose()
  @IsNotEmpty({ message: 'name is required' })
  @IsString({ message: 'name must be a string' })
  name: string;

  @Expose()
  @IsNotEmpty({ message: 'date is required' })
  @Matches(/^\d{1,2}\.\d{1,2}\.\d{4}$/, {
    message: 'date must be in format d.m.Y',
  })
  date: string;
}