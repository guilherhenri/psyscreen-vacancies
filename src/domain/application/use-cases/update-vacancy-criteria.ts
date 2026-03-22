import { Injectable } from '@nestjs/common'

import { type Either, left, right } from '@/core/either'
import { type VacancyCriteriaItem } from '@/domain/enterprise/entities/vacancy'

import { VacanciesRepository } from '../repositories/vacancies-repository'
import { VacancyNotFoundError } from './errors/vacancy-not-found'

interface UpdateVacancyCriteriaRequest {
  vacancyId: string
  criteria: VacancyCriteriaItem[]
}

type UpdateVacancyCriteriaResponse = Either<
  VacancyNotFoundError,
  { criteriaVersion: number }
>

@Injectable()
export class UpdateVacancyCriteria {
  constructor(private vacanciesRepository: VacanciesRepository) {}

  async execute({
    vacancyId,
    criteria,
  }: UpdateVacancyCriteriaRequest): Promise<UpdateVacancyCriteriaResponse> {
    const vacancy = await this.vacanciesRepository.findById(vacancyId)

    if (!vacancy) {
      return left(new VacancyNotFoundError())
    }

    vacancy.updateCriteria(criteria)
    await this.vacanciesRepository.save(vacancy)

    return right({ criteriaVersion: vacancy.criteriaVersion })
  }
}
