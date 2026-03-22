import { InMemoryCandidateVacanciesRepository } from '@test/repositories/in-memory-candidate-vacancies-repository'
import { InMemoryVacanciesRepository } from '@test/repositories/in-memory-vacancies-repository'

import { Vacancy } from '@/domain/enterprise/entities/vacancy'

import { LinkCandidateToVacancy } from './link-candidate-to-vacancy'

let inMemoryVacanciesRepository: InMemoryVacanciesRepository
let inMemoryCandidateVacanciesRepository: InMemoryCandidateVacanciesRepository
let sut: LinkCandidateToVacancy

describe('Link Candidate To Vacancy Use-case', () => {
  beforeEach(() => {
    inMemoryVacanciesRepository = new InMemoryVacanciesRepository()
    inMemoryCandidateVacanciesRepository =
      new InMemoryCandidateVacanciesRepository()
    sut = new LinkCandidateToVacancy(
      inMemoryVacanciesRepository,
      inMemoryCandidateVacanciesRepository
    )
  })

  it('should link candidate to vacancy', async () => {
    const vacancy = Vacancy.create({
      title: 'Developer',
      description: 'Role description',
      status: 'open',
      criteria: [],
    })

    await inMemoryVacanciesRepository.create(vacancy)

    const response = await sut.execute({
      vacancyId: vacancy.id.toString(),
      candidateId: 'candidate-1',
      status: 'linked',
    })

    expect(response.isRight()).toBeTruthy()
    expect(inMemoryCandidateVacanciesRepository.items).toHaveLength(1)
    expect(inMemoryCandidateVacanciesRepository.items[0]).toMatchObject({
      props: {
        candidateId: 'candidate-1',
        vacancyId: vacancy.id.toString(),
        status: 'linked',
      },
    })
  })

  it('should not create duplicate links', async () => {
    const vacancy = Vacancy.create({
      title: 'Developer',
      description: 'Role description',
      status: 'open',
      criteria: [],
    })

    await inMemoryVacanciesRepository.create(vacancy)

    await sut.execute({
      vacancyId: vacancy.id.toString(),
      candidateId: 'candidate-1',
      status: 'linked',
    })

    const response = await sut.execute({
      vacancyId: vacancy.id.toString(),
      candidateId: 'candidate-1',
      status: 'linked',
    })

    expect(response.isRight()).toBeTruthy()
    expect(inMemoryCandidateVacanciesRepository.items).toHaveLength(1)
  })

  it('should return error when vacancy does not exist', async () => {
    const response = await sut.execute({
      vacancyId: 'missing-id',
      candidateId: 'candidate-1',
      status: 'linked',
    })

    expect(response.isLeft()).toBeTruthy()
  })
})
