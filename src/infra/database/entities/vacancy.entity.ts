import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

@Entity('vacancies')
export class Vacancy {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar' })
  title: string

  @Column({ type: 'text' })
  description: string

  @Column({ type: 'varchar' })
  status: string

  @Column({ name: 'criteria_version', type: 'integer' })
  criteriaVersion: number

  @Column({ type: 'jsonb' })
  criteria: Array<{ key: string; weight: number }>

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt: Date | null
}
