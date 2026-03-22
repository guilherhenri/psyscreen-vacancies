import { AggregateRoot } from '@/core/entities/aggregate-root'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'

import { VacancyCreatedEvent } from '../events/vacancy-created'
import { VacancyCriteriaUpdatedEvent } from '../events/vacancy-criteria-updated'
import { VacancyUpdatedEvent } from '../events/vacancy-updated'

export type VacancyStatus = 'draft' | 'open' | 'closed'

export interface VacancyCriteriaItem {
  key: string
  weight: number
}

interface VacancyProps {
  title: string
  description: string
  status: VacancyStatus
  criteriaVersion: number
  criteria: VacancyCriteriaItem[]
  createdAt: Date
  updatedAt?: Date | null
}

export class Vacancy extends AggregateRoot<VacancyProps> {
  get title() {
    return this.props.title
  }

  get description() {
    return this.props.description
  }

  get status() {
    return this.props.status
  }

  get criteriaVersion() {
    return this.props.criteriaVersion
  }

  get criteria() {
    return this.props.criteria
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  updateDetails(data: {
    title: string
    description: string
    status: VacancyStatus
  }) {
    this.props.title = data.title
    this.props.description = data.description
    this.props.status = data.status
    this.touch()

    this.addDomainEvent(new VacancyUpdatedEvent(this))
  }

  updateCriteria(criteria: VacancyCriteriaItem[]) {
    this.props.criteria = criteria
    this.props.criteriaVersion += 1
    this.touch()

    this.addDomainEvent(new VacancyCriteriaUpdatedEvent(this))
  }

  private touch() {
    this.props.updatedAt = new Date()
  }

  static create(
    props: Optional<VacancyProps, 'createdAt' | 'criteriaVersion'>,
    id?: UniqueEntityID
  ) {
    const vacancy = new Vacancy(
      {
        ...props,
        criteriaVersion: props.criteriaVersion ?? 1,
        createdAt: props.createdAt ?? new Date(),
      },
      id
    )

    if (!id) {
      vacancy.addDomainEvent(new VacancyCreatedEvent(vacancy))
    }

    return vacancy
  }
}
