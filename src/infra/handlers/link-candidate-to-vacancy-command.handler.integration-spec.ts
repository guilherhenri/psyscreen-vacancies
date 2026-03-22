import type { INestApplication } from '@nestjs/common'
import type { ClientKafka } from '@nestjs/microservices'
import { Test } from '@nestjs/testing'
import {
  type LinkCandidateToVacancyCommand,
  VacancyCommandTopics,
} from '@psyscreen/contracts'
import { createVacanciesTestClient } from '@test/config/clients.config'
import { getMicroserviceConfig } from '@test/config/microservice.config'
import { kafkaSetup } from '@test/helpers/kafka-setup'
import type { StartedRedpandaContainer } from '@testcontainers/redpanda'
import { firstValueFrom } from 'rxjs'
import type { Repository } from 'typeorm'

import { EventPublisher } from '@/core/ports/event-publisher'
import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { CandidateVacancy } from '@/infra/database/entities/candidate-vacancy.entity'
import { Vacancy } from '@/infra/database/entities/vacancy.entity'
import { TypeOrmService } from '@/infra/database/typeorm.service'

describe('LinkCandidateToVacancyCommandHandler (Integration)', () => {
  let app: INestApplication
  let client: ClientKafka
  let typeorm: TypeOrmService
  let vacanciesRepository: Repository<Vacancy>
  let candidateVacanciesRepository: Repository<CandidateVacancy>
  let kafkaContainer: StartedRedpandaContainer

  beforeAll(async () => {
    const { container, brokers } = await kafkaSetup()
    kafkaContainer = container

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
    })
      .overrideProvider(EventPublisher)
      .useValue({
        publish: jest.fn(),
        publishBatch: jest.fn(),
      })
      .overrideProvider('VACANCIES_SERVICE')
      .useFactory({
        factory: () => createVacanciesTestClient(brokers),
      })
      .compile()

    app = moduleRef.createNestApplication()
    app.connectMicroservice(getMicroserviceConfig(brokers))

    typeorm = moduleRef.get(TypeOrmService)
    client = moduleRef.get('VACANCIES_SERVICE')
    vacanciesRepository = typeorm.getRepository(Vacancy)
    candidateVacanciesRepository = typeorm.getRepository(CandidateVacancy)

    client.subscribeToResponseOf(VacancyCommandTopics.LINK_CANDIDATE)

    await client.connect()
    await app.startAllMicroservices()
    await app.init()
  })

  afterAll(async () => {
    await Promise.all([client.close(), typeorm.destroy()])
    await app.close()

    if (kafkaContainer) {
      await kafkaContainer.stop()
    }
  })

  afterEach(async () => {
    await candidateVacanciesRepository.clear()
    await vacanciesRepository.clear()
  })

  it('should link a candidate to vacancy', async () => {
    const vacancy = await vacanciesRepository.save({
      title: 'Developer',
      description: 'Role description',
      status: 'open',
      criteriaVersion: 1,
      criteria: [],
    })

    const command: LinkCandidateToVacancyCommand = {
      vacancyId: vacancy.id,
      candidateId: '9b7b7b2e-31d5-4c47-8cc1-642a0c72d8a1',
      status: 'linked',
    }

    const response = await firstValueFrom(
      client.send(VacancyCommandTopics.LINK_CANDIDATE, command)
    )

    expect(response.success).toBeTruthy()
    const link = await candidateVacanciesRepository.findOne({
      where: {
        vacancyId: vacancy.id,
        candidateId: '9b7b7b2e-31d5-4c47-8cc1-642a0c72d8a1',
      },
    })

    expect(link).toBeTruthy()
  })
})
