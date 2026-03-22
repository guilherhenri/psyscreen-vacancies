import type { INestApplication } from '@nestjs/common'
import type { ClientKafka } from '@nestjs/microservices'
import { Test } from '@nestjs/testing'
import {
  type UpdateVacancyCriteriaCommand,
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
import { Vacancy } from '@/infra/database/entities/vacancy.entity'
import { TypeOrmService } from '@/infra/database/typeorm.service'

describe('UpdateVacancyCriteriaCommandHandler (Integration)', () => {
  let app: INestApplication
  let client: ClientKafka
  let typeorm: TypeOrmService
  let vacanciesRepository: Repository<Vacancy>
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

    client.subscribeToResponseOf(VacancyCommandTopics.UPDATE_CRITERIA)

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
    await vacanciesRepository.clear()
  })

  it('should update vacancy criteria', async () => {
    const vacancy = await vacanciesRepository.save({
      title: 'Developer',
      description: 'Role description',
      status: 'open',
      criteriaVersion: 1,
      criteria: [{ key: 'leadership', weight: 50 }],
    })

    const command: UpdateVacancyCriteriaCommand = {
      vacancyId: vacancy.id,
      criteria: [{ key: 'adaptability', weight: 80 }],
    }

    const response = await firstValueFrom(
      client.send(VacancyCommandTopics.UPDATE_CRITERIA, command)
    )

    expect(response.success).toBeTruthy()
    expect(response.data?.criteriaVersion).toBe(2)
    const updated = await vacanciesRepository.findOne({
      where: { id: vacancy.id },
    })

    expect(updated?.criteriaVersion).toBe(2)
  })
})
