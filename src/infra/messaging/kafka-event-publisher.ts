import { Injectable } from '@nestjs/common'
import {
  type VacancyCandidateLinkedEvent as VacancyCandidateLinkedPayload,
  type VacancyCreatedEvent as VacancyCreatedPayload,
  type VacancyCriteriaUpdatedEvent as VacancyCriteriaUpdatedPayload,
  VacancyTopics,
  type VacancyUpdatedEvent as VacancyUpdatedPayload,
} from '@psyscreen/contracts'

import { DomainEvent } from '@/core/events/domain-event'
import { EventPublisher } from '@/core/ports/event-publisher'
import { VacancyCandidateLinkedEvent } from '@/domain/enterprise/events/vacancy-candidate-linked'
import { VacancyCreatedEvent } from '@/domain/enterprise/events/vacancy-created'
import { VacancyCriteriaUpdatedEvent } from '@/domain/enterprise/events/vacancy-criteria-updated'
import { VacancyUpdatedEvent } from '@/domain/enterprise/events/vacancy-updated'

import { KafkaService } from '../services/kafka.service'

const EVENT_TO_TOPIC: Record<string, string> = {
  VacancyCreatedEvent: VacancyTopics.VACANCY_CREATED,
  VacancyUpdatedEvent: VacancyTopics.VACANCY_UPDATED,
  VacancyCriteriaUpdatedEvent: VacancyTopics.VACANCY_CRITERIA_UPDATED,
  VacancyCandidateLinkedEvent: VacancyTopics.VACANCY_CANDIDATE_LINKED,
}

@Injectable()
export class KafkaEventPublisher implements EventPublisher {
  constructor(private readonly kafkaService: KafkaService) {}

  async publish(event: DomainEvent): Promise<void> {
    await this.publishBatch([event])
  }

  async publishBatch(events: DomainEvent[]): Promise<void> {
    if (events.length === 0) return

    await Promise.all(
      events.map((event) => {
        const topic = this.getTopicName(event)
        const aggregateId = event.getAggregateId().toString()
        const payload = {
          eventType: event.constructor.name,
          occurredAt: event.occurredAt || new Date(),
          aggregateId,
          payload: this.buildPayload(event),
        }

        return this.kafkaService.emit(topic, {
          key: aggregateId,
          value: payload,
          headers: {
            eventType: event.constructor.name,
            aggregateId,
          },
        })
      })
    )
  }

  private getTopicName(event: DomainEvent): string {
    const eventName = event.constructor.name

    if (EVENT_TO_TOPIC[eventName]) {
      return EVENT_TO_TOPIC[eventName]
    }

    const dynamicTopic = eventName
      .replace(/Event$/, '')
      .replace(/([A-Z])/g, (match, _p1, offset) =>
        offset > 0 ? `_${match.toLowerCase()}` : match.toLowerCase()
      )

    console.warn(
      `Event ${eventName} not found in static mapping. Using dynamic topic: ${dynamicTopic}. Consider adding to EVENT_TO_TOPIC mapping.`
    )

    return `vacancies.event.${dynamicTopic}`
  }

  private buildPayload(
    event: DomainEvent
  ):
    | VacancyCreatedPayload
    | VacancyUpdatedPayload
    | VacancyCriteriaUpdatedPayload
    | VacancyCandidateLinkedPayload
    | Record<string, unknown> {
    if (event.constructor.name === 'VacancyCreatedEvent') {
      const vacancy = (event as VacancyCreatedEvent).vacancy

      const payload: VacancyCreatedPayload = {
        vacancyId: vacancy.id.toString(),
        title: vacancy.title,
        description: vacancy.description,
        status: vacancy.status,
        criteriaVersion: vacancy.criteriaVersion,
        criteria: vacancy.criteria,
      }

      return payload
    }

    if (event.constructor.name === 'VacancyUpdatedEvent') {
      const vacancy = (event as VacancyUpdatedEvent).vacancy

      const payload: VacancyUpdatedPayload = {
        vacancyId: vacancy.id.toString(),
        title: vacancy.title,
        description: vacancy.description,
        status: vacancy.status,
      }

      return payload
    }

    if (event.constructor.name === 'VacancyCriteriaUpdatedEvent') {
      const vacancy = (event as VacancyCriteriaUpdatedEvent).vacancy

      const payload: VacancyCriteriaUpdatedPayload = {
        vacancyId: vacancy.id.toString(),
        criteriaVersion: vacancy.criteriaVersion,
        criteria: vacancy.criteria,
      }

      return payload
    }

    if (event.constructor.name === 'VacancyCandidateLinkedEvent') {
      const link = (event as VacancyCandidateLinkedEvent).link

      const payload: VacancyCandidateLinkedPayload = {
        vacancyId: link.vacancyId,
        candidateId: link.candidateId,
        status: link.status,
      }

      return payload
    }

    return this.serializeEvent(event)
  }

  private serializeEvent(event: DomainEvent): Record<string, unknown> {
    const serialized: Record<string, unknown> = {}

    for (const key in event) {
      if (
        key === 'occurredAt' ||
        key === 'constructor' ||
        key === 'getAggregateId'
      ) {
        continue
      }

      const value = event[key as keyof typeof event]

      if (value && typeof value === 'object' && 'toJSON' in value) {
        serialized[key] = (value as { toJSON(): unknown }).toJSON()
      } else if (
        value &&
        typeof value === 'object' &&
        value !== null &&
        'id' in value
      ) {
        const obj = value as Record<string, unknown>
        const idValue = obj.id

        const serializedId =
          typeof idValue === 'object' &&
          idValue !== null &&
          'toString' in idValue
            ? String(idValue)
            : String(idValue)

        const { id: _originalId, ...objWithoutId } = obj as Record<
          string,
          unknown
        >
        void _originalId
        serialized[key] = {
          id: serializedId,
          ...objWithoutId,
        }
      } else {
        serialized[key] = value
      }
    }

    return serialized
  }
}
