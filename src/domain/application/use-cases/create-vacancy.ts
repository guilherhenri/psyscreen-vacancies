import { Injectable } from '@nestjs/common'

import { type Either, right } from '@/core/either'
import {
  Vacancy,
  type VacancyCriteriaItem,
  type VacancyStatus,
} from '@/domain/enterprise/entities/vacancy'

import { VacanciesRepository } from '../repositories/vacancies-repository'

interface CreateVacancyRequest {
  title: string
  description: string
  status: VacancyStatus
  criteria: VacancyCriteriaItem[]
}

type CreateVacancyResponse = Either<null, { vacancy: Vacancy }>

@Injectable()
export class CreateVacancy {
  constructor(private vacanciesRepository: VacanciesRepository) {}

  async execute({
    title,
    description,
    status,
    criteria,
  }: CreateVacancyRequest): Promise<CreateVacancyResponse> {
    const vacancy = Vacancy.create({
      title,
      description,
      status,
      criteria,
    })

    await this.vacanciesRepository.create(vacancy)

    return right({ vacancy })
  }
}
