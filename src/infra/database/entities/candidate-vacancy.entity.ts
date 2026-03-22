import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm'

@Entity('candidate_vacancies')
@Index(['candidateId', 'vacancyId'], { unique: true })
export class CandidateVacancy {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'candidate_id', type: 'uuid' })
  candidateId: string

  @Column({ name: 'vacancy_id', type: 'uuid' })
  vacancyId: string

  @Column({ type: 'varchar' })
  status: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
