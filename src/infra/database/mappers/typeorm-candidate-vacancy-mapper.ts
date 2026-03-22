import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  CandidateVacancy,
  type CandidateVacancyStatus,
} from '@/domain/enterprise/entities/candidate-vacancy'

import type { CandidateVacancy as TypeOrmCandidateVacancy } from '../entities/candidate-vacancy.entity'

export class TypeOrmCandidateVacancyMapper {
  static toDomain(raw: TypeOrmCandidateVacancy): CandidateVacancy {
    return CandidateVacancy.create(
      {
        candidateId: raw.candidateId,
        vacancyId: raw.vacancyId,
        status: raw.status as CandidateVacancyStatus,
        createdAt: raw.createdAt,
      },
      new UniqueEntityID(raw.id)
    )
  }

  static toTypeOrm(link: CandidateVacancy): TypeOrmCandidateVacancy {
    return {
      id: link.id.toString(),
      candidateId: link.candidateId,
      vacancyId: link.vacancyId,
      status: link.status,
      createdAt: link.createdAt,
    }
  }
}
