import { ConfigModule } from '@nestjs/config'
import { Test } from '@nestjs/testing'
import { VacancyTopics } from '@psyscreen/contracts'
import { kafkaSetup } from '@test/helpers/kafka-setup'
import type { StartedRedpandaContainer } from '@testcontainers/redpanda'
import { Kafka } from 'kafkajs'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import type { DomainEvent } from '@/core/events/domain-event'
import { envSchema } from '@/infra/env/env'
import { EnvModule } from '@/infra/env/env.module'

import { ServicesModule } from '../services/services.module'
import { KafkaEventPublisher } from './kafka-event-publisher'

interface MockDomainEvent extends DomainEvent {
  [key: string]: unknown
}

interface CreateMockEventOptions {
  eventName?: string
  aggregateId?: string
  payload?: Record<string, unknown>
}

function createMockEvent({
  eventName = 'MockDomainEvent',
  aggregateId,
  payload = {},
}: CreateMockEventOptions = {}): MockDomainEvent {
  return {
    occurredAt: new Date(),
    constructor: { name: eventName } as new () => MockDomainEvent,
    getAggregateId: () => new UniqueEntityID(aggregateId),
    ...payload,
  }
}

describe('KafkaEventPublisher (Integration)', () => {
  let kafkaEventPublisher: KafkaEventPublisher
  let container: StartedRedpandaContainer
  let kafkaBroker: string

  beforeAll(async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})

    const kafka = await kafkaSetup()
    container = kafka.container
    kafkaBroker = kafka.brokers[0]

    const admin = new Kafka({
      clientId: 'kafka-event-publisher-admin',
      brokers: [kafkaBroker],
    }).admin()

    await admin.connect()
    await admin.createTopics({
      topics: [
        { topic: VacancyTopics.VACANCY_CREATED },
        { topic: VacancyTopics.VACANCY_UPDATED },
        { topic: VacancyTopics.VACANCY_CRITERIA_UPDATED },
        { topic: VacancyTopics.VACANCY_CANDIDATE_LINKED },
        { topic: 'vacancies.event.unknown' },
        { topic: 'vacancies.event.unknown_domain' },
      ],
    })
    await admin.disconnect()

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          validate: (env) =>
            envSchema.parse({
              ...env,
              KAFKA_BROKER: kafkaBroker,
              KAFKA_CLIENT_ID: 'test-vacancies',
              KAFKA_RETRY_COUNT: 0,
            }),
          isGlobal: true,
        }),
        EnvModule,
        ServicesModule,
      ],
      providers: [KafkaEventPublisher],
    }).compile()

    kafkaEventPublisher = moduleRef.get(KafkaEventPublisher)
  })

  afterAll(async () => {
    if (container) {
      await container.stop()
    }

    jest.restoreAllMocks()
  })

  describe('publish', () => {
    it('should publish a single domain event', async () => {
      const mockEvent = createMockEvent({
        eventName: 'VacancyCreatedEvent',
        aggregateId: 'vacancy-1',
        payload: {
          vacancy: {
            id: new UniqueEntityID('vacancy-1'),
            title: 'Developer',
            description: 'Role description',
            status: 'draft',
            criteriaVersion: 1,
            criteria: [{ key: 'leadership', weight: 70 }],
            createdAt: new Date(),
          },
        },
      })

      await expect(
        kafkaEventPublisher.publish(mockEvent)
      ).resolves.not.toThrow()
    })

    it('should handle events not in static mapping', async () => {
      const mockEvent = createMockEvent({
        eventName: 'UnknownEvent',
        aggregateId: 'test-aggregate-id',
        payload: {
          data: 'test',
        },
      })

      await expect(
        kafkaEventPublisher.publish(mockEvent)
      ).resolves.not.toThrow()
    })
  })

  describe('publishBatch', () => {
    it('should publish multiple events', async () => {
      const mockEvents: MockDomainEvent[] = [
        createMockEvent({
          eventName: 'VacancyUpdatedEvent',
          aggregateId: 'vacancy-1',
          payload: {
            vacancy: {
              id: new UniqueEntityID('vacancy-1'),
              title: 'Developer',
              description: 'Role description',
              status: 'open',
              criteriaVersion: 1,
              criteria: [],
              createdAt: new Date(),
            },
          },
        }),
        createMockEvent({
          eventName: 'VacancyCriteriaUpdatedEvent',
          aggregateId: 'vacancy-2',
          payload: {
            vacancy: {
              id: new UniqueEntityID('vacancy-2'),
              title: 'Designer',
              description: 'Role description',
              status: 'open',
              criteriaVersion: 2,
              criteria: [{ key: 'creativity', weight: 90 }],
              createdAt: new Date(),
            },
          },
        }),
      ]

      await expect(
        kafkaEventPublisher.publishBatch(mockEvents)
      ).resolves.not.toThrow()
    })

    it('should handle empty batch', async () => {
      await expect(kafkaEventPublisher.publishBatch([])).resolves.not.toThrow()
    })
  })

  describe('topic mapping', () => {
    it('should use correct topic for VacancyCreatedEvent', () => {
      const mockEvent = createMockEvent({
        eventName: 'VacancyCreatedEvent',
        aggregateId: 'vacancy-1',
      })

      const topicName = (
        kafkaEventPublisher as unknown as {
          getTopicName: (event: DomainEvent) => string
        }
      ).getTopicName(mockEvent)

      expect(topicName).toBe(VacancyTopics.VACANCY_CREATED)
    })

    it('should generate dynamic topic for unknown events', () => {
      const mockEvent = createMockEvent({
        eventName: 'UnknownDomainEvent',
        aggregateId: 'test-id',
      })

      const topicName = (
        kafkaEventPublisher as unknown as {
          getTopicName: (event: DomainEvent) => string
        }
      ).getTopicName(mockEvent)

      expect(topicName).toBe('vacancies.event.unknown_domain')
    })
  })

  describe('event serialization', () => {
    it('should serialize events with toJSON method', () => {
      const mockEvent = createMockEvent({
        eventName: 'TestEvent',
        aggregateId: 'test-id',
        payload: {
          complexObject: {
            toJSON: () => ({ serialized: true, value: 'test' }),
          },
        },
      })

      const serialized = (
        kafkaEventPublisher as unknown as {
          serializeEvent: (event: DomainEvent) => Record<string, unknown>
        }
      ).serializeEvent(mockEvent)

      expect(serialized.complexObject).toEqual({
        serialized: true,
        value: 'test',
      })
    })

    it('should serialize objects with id property', () => {
      const mockEvent = createMockEvent({
        eventName: 'TestEvent',
        aggregateId: 'test-id',
        payload: {
          entity: {
            id: 'entity-id',
            name: 'test',
            value: 123,
          },
        },
      })

      const serialized = (
        kafkaEventPublisher as unknown as {
          serializeEvent: (event: DomainEvent) => Record<string, unknown>
        }
      ).serializeEvent(mockEvent)

      expect(serialized.entity).toEqual({
        id: 'entity-id',
        name: 'test',
        value: 123,
      })
    })

    it('should skip occurredAt property', () => {
      const mockEvent = createMockEvent({
        eventName: 'TestEvent',
        aggregateId: 'test-id',
        payload: {
          data: 'test',
        },
      })

      const serialized = (
        kafkaEventPublisher as unknown as {
          serializeEvent: (event: DomainEvent) => Record<string, unknown>
        }
      ).serializeEvent(mockEvent)

      expect(serialized.occurredAt).toBeUndefined()
      expect(serialized.data).toBe('test')
    })
  })
})
