import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { DomainEvent } from '@/core/events/domain-event'

import { Vacancy } from '../entities/vacancy'

export class VacancyCriteriaUpdatedEvent implements DomainEvent {
  public readonly occurredAt: Date
  public readonly vacancy: Vacancy

  constructor(vacancy: Vacancy) {
    this.vacancy = vacancy
    this.occurredAt = new Date()
  }

  getAggregateId(): UniqueEntityID {
    return this.vacancy.id
  }
}
