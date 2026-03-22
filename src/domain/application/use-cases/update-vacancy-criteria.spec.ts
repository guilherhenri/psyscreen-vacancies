import { InMemoryVacanciesRepository } from '@test/repositories/in-memory-vacancies-repository'

import { Vacancy } from '@/domain/enterprise/entities/vacancy'

import { UpdateVacancyCriteria } from './update-vacancy-criteria'

let inMemoryVacanciesRepository: InMemoryVacanciesRepository
let sut: UpdateVacancyCriteria

describe('Update Vacancy Criteria Use-case', () => {
  beforeEach(() => {
    inMemoryVacanciesRepository = new InMemoryVacanciesRepository()
    sut = new UpdateVacancyCriteria(inMemoryVacanciesRepository)
  })

  it('should update criteria and increment version', async () => {
    const vacancy = Vacancy.create({
      title: 'Developer',
      description: 'Role description',
      status: 'open',
      criteria: [{ key: 'leadership', weight: 50 }],
    })

    await inMemoryVacanciesRepository.create(vacancy)

    const response = await sut.execute({
      vacancyId: vacancy.id.toString(),
      criteria: [{ key: 'adaptability', weight: 80 }],
    })

    expect(response.isRight()).toBeTruthy()
    if (response.isRight()) {
      expect(response.value.criteriaVersion).toBe(2)
    }
    expect(inMemoryVacanciesRepository.items[0]).toMatchObject({
      props: {
        criteriaVersion: 2,
      },
    })
  })

  it('should return error when vacancy does not exist', async () => {
    const response = await sut.execute({
      vacancyId: 'missing-id',
      criteria: [{ key: 'adaptability', weight: 80 }],
    })

    expect(response.isLeft()).toBeTruthy()
  })
})
