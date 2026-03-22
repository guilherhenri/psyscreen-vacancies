import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  Vacancy,
  type VacancyCriteriaItem,
  type VacancyStatus,
} from '@/domain/enterprise/entities/vacancy'

import type { Vacancy as TypeOrmVacancy } from '../entities/vacancy.entity'

export class TypeOrmVacancyMapper {
  static toDomain(raw: TypeOrmVacancy): Vacancy {
    return Vacancy.create(
      {
        title: raw.title,
        description: raw.description,
        status: raw.status as VacancyStatus,
        criteriaVersion: raw.criteriaVersion,
        criteria: raw.criteria as VacancyCriteriaItem[],
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id)
    )
  }

  static toTypeOrm(vacancy: Vacancy): TypeOrmVacancy {
    return {
      id: vacancy.id.toString(),
      title: vacancy.title,
      description: vacancy.description,
      status: vacancy.status,
      criteriaVersion: vacancy.criteriaVersion,
      criteria: vacancy.criteria,
      createdAt: vacancy.createdAt,
      updatedAt: vacancy.updatedAt ?? null,
    }
  }
}
