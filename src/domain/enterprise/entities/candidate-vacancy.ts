import { AggregateRoot } from '@/core/entities/aggregate-root'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'

import { VacancyCandidateLinkedEvent } from '../events/vacancy-candidate-linked'

export type CandidateVacancyStatus = 'linked' | 'active' | 'archived'

interface CandidateVacancyProps {
  candidateId: string
  vacancyId: string
  status: CandidateVacancyStatus
  createdAt: Date
}

export class CandidateVacancy extends AggregateRoot<CandidateVacancyProps> {
  get candidateId() {
    return this.props.candidateId
  }

  get vacancyId() {
    return this.props.vacancyId
  }

  get status() {
    return this.props.status
  }

  get createdAt() {
    return this.props.createdAt
  }

  static create(
    props: Optional<CandidateVacancyProps, 'createdAt'>,
    id?: UniqueEntityID
  ) {
    const link = new CandidateVacancy(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id
    )

    if (!id) {
      link.addDomainEvent(new VacancyCandidateLinkedEvent(link))
    }

    return link
  }
}
