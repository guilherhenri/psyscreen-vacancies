import { CandidateVacanciesRepository } from '@/domain/application/repositories/candidate-vacancies-repository'
import { CandidateVacancy } from '@/domain/enterprise/entities/candidate-vacancy'

export class InMemoryCandidateVacanciesRepository implements CandidateVacanciesRepository {
  public items: CandidateVacancy[] = []

  async findByCandidateAndVacancy(
    candidateId: string,
    vacancyId: string
  ): Promise<CandidateVacancy | null> {
    return (
      this.items.find(
        (item) =>
          item.candidateId === candidateId && item.vacancyId === vacancyId
      ) ?? null
    )
  }

  async findByVacancyId(vacancyId: string): Promise<CandidateVacancy[]> {
    return this.items.filter((item) => item.vacancyId === vacancyId)
  }

  async create(link: CandidateVacancy): Promise<void> {
    this.items.push(link)
  }
}
