import { Injectable } from '@nestjs/common'

import { type Either, left, right } from '@/core/either'
import { type VacancyStatus } from '@/domain/enterprise/entities/vacancy'

import { VacanciesRepository } from '../repositories/vacancies-repository'
import { VacancyNotFoundError } from './errors/vacancy-not-found'

interface UpdateVacancyRequest {
  vacancyId: string
  title: string
  description: string
  status: VacancyStatus
}

type UpdateVacancyResponse = Either<VacancyNotFoundError, null>

@Injectable()
export class UpdateVacancy {
  constructor(private vacanciesRepository: VacanciesRepository) {}

  async execute({
    vacancyId,
    title,
    description,
    status,
  }: UpdateVacancyRequest): Promise<UpdateVacancyResponse> {
    const vacancy = await this.vacanciesRepository.findById(vacancyId)

    if (!vacancy) {
      return left(new VacancyNotFoundError())
    }

    vacancy.updateDetails({ title, description, status })
    await this.vacanciesRepository.save(vacancy)

    return right(null)
  }
}
