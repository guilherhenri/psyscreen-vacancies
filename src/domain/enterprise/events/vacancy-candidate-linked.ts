import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { DomainEvent } from '@/core/events/domain-event'

import { CandidateVacancy } from '../entities/candidate-vacancy'

export class VacancyCandidateLinkedEvent implements DomainEvent {
  public readonly occurredAt: Date
  public readonly link: CandidateVacancy

  constructor(link: CandidateVacancy) {
    this.link = link
    this.occurredAt = new Date()
  }

  getAggregateId(): UniqueEntityID {
    return this.link.id
  }
}
