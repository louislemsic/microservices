import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string;

  @Column()
  clientId: string;

  @Column({ default: true })
  isActive: boolean;

  @Column('simple-array', { default: [] })
  allowedServices: string[];

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
