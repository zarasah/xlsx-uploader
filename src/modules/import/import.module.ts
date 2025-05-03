import { Module } from '@nestjs/common';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { TypeOrmModule } from "@nestjs/typeorm";
import { ImportRowEntity } from "./entity/import.row.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ImportRowEntity])],
  controllers: [ImportController],
  providers: [ImportService]
})
export class ImportModule {}
