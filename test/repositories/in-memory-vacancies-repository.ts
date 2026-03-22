import { VacanciesRepository } from '@/domain/application/repositories/vacancies-repository'
import { Vacancy } from '@/domain/enterprise/entities/vacancy'

export class InMemoryVacanciesRepository implements VacanciesRepository {
  public items: Vacancy[] = []

  async findById(id: string): Promise<Vacancy | null> {
    return this.items.find((vacancy) => vacancy.id.toString() === id) ?? null
  }

  async create(vacancy: Vacancy): Promise<void> {
    this.items.push(vacancy)
  }

  async save(vacancy: Vacancy): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(vacancy.id))

    if (index === -1) {
      this.items.push(vacancy)
      return
    }

    this.items[index] = vacancy
  }
}
