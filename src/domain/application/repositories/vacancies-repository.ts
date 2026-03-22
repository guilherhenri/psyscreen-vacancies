import type { Vacancy } from '@/domain/enterprise/entities/vacancy'

export abstract class VacanciesRepository {
  abstract findById(id: string): Promise<Vacancy | null>
  abstract create(vacancy: Vacancy): Promise<void>
  abstract save(vacancy: Vacancy): Promise<void>
}
