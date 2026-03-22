import type { CandidateVacancy } from '@/domain/enterprise/entities/candidate-vacancy'

export abstract class CandidateVacanciesRepository {
  abstract findByCandidateAndVacancy(
    candidateId: string,
    vacancyId: string
  ): Promise<CandidateVacancy | null>
  abstract findByVacancyId(vacancyId: string): Promise<CandidateVacancy[]>
  abstract create(link: CandidateVacancy): Promise<void>
}
