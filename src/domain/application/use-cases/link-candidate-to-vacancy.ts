import { Injectable } from '@nestjs/common'

import { type Either, left, right } from '@/core/either'
import {
  CandidateVacancy,
  type CandidateVacancyStatus,
} from '@/domain/enterprise/entities/candidate-vacancy'

import { CandidateVacanciesRepository } from '../repositories/candidate-vacancies-repository'
import { VacanciesRepository } from '../repositories/vacancies-repository'
import { VacancyNotFoundError } from './errors/vacancy-not-found'

interface LinkCandidateToVacancyRequest {
  vacancyId: string
  candidateId: string
  status: CandidateVacancyStatus
}

type LinkCandidateToVacancyResponse = Either<VacancyNotFoundError, null>

@Injectable()
export class LinkCandidateToVacancy {
  constructor(
    private vacanciesRepository: VacanciesRepository,
    private candidateVacanciesRepository: CandidateVacanciesRepository
  ) {}

  async execute({
    vacancyId,
    candidateId,
    status,
  }: LinkCandidateToVacancyRequest): Promise<LinkCandidateToVacancyResponse> {
    const vacancy = await this.vacanciesRepository.findById(vacancyId)

    if (!vacancy) {
      return left(new VacancyNotFoundError())
    }

    const existing =
      await this.candidateVacanciesRepository.findByCandidateAndVacancy(
        candidateId,
        vacancyId
      )

    if (existing) {
      return right(null)
    }

    const link = CandidateVacancy.create({
      candidateId,
      vacancyId,
      status,
    })

    await this.candidateVacanciesRepository.create(link)

    return right(null)
  }
}
