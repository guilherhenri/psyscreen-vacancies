import { InMemoryVacanciesRepository } from '@test/repositories/in-memory-vacancies-repository'

import { CreateVacancy } from './create-vacancy'

let inMemoryVacanciesRepository: InMemoryVacanciesRepository
let sut: CreateVacancy

describe('Create Vacancy Use-case', () => {
  beforeEach(() => {
    inMemoryVacanciesRepository = new InMemoryVacanciesRepository()
    sut = new CreateVacancy(inMemoryVacanciesRepository)
  })

  it('should create a vacancy', async () => {
    const response = await sut.execute({
      title: 'Developer',
      description: 'Role description',
      status: 'draft',
      criteria: [{ key: 'leadership', weight: 70 }],
    })

    expect(response.isRight()).toBeTruthy()
    expect(inMemoryVacanciesRepository.items).toHaveLength(1)
    expect(inMemoryVacanciesRepository.items[0]).toMatchObject({
      props: {
        title: 'Developer',
        description: 'Role description',
        status: 'draft',
        criteriaVersion: 1,
      },
    })
  })
})
