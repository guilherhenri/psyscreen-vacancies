import { InMemoryVacanciesRepository } from '@test/repositories/in-memory-vacancies-repository'

import { Vacancy } from '@/domain/enterprise/entities/vacancy'

import { UpdateVacancy } from './update-vacancy'

let inMemoryVacanciesRepository: InMemoryVacanciesRepository
let sut: UpdateVacancy

describe('Update Vacancy Use-case', () => {
  beforeEach(() => {
    inMemoryVacanciesRepository = new InMemoryVacanciesRepository()
    sut = new UpdateVacancy(inMemoryVacanciesRepository)
  })

  it('should update a vacancy', async () => {
    const vacancy = Vacancy.create({
      title: 'Developer',
      description: 'Role description',
      status: 'draft',
      criteria: [],
    })

    await inMemoryVacanciesRepository.create(vacancy)

    const response = await sut.execute({
      vacancyId: vacancy.id.toString(),
      title: 'Senior Developer',
      description: 'Updated description',
      status: 'open',
    })

    expect(response.isRight()).toBeTruthy()
    expect(inMemoryVacanciesRepository.items[0]).toMatchObject({
      props: {
        title: 'Senior Developer',
        description: 'Updated description',
        status: 'open',
      },
    })
  })

  it('should return error when vacancy does not exist', async () => {
    const response = await sut.execute({
      vacancyId: 'missing-id',
      title: 'Senior Developer',
      description: 'Updated description',
      status: 'open',
    })

    expect(response.isLeft()).toBeTruthy()
  })
})
