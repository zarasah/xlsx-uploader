import { PrimaryGeneratedColumn, UpdateDateColumn, CreateDateColumn } from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn()
  internalId: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)' })
  updatedAt: Date;
}
