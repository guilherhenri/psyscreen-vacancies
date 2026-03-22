import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { DomainEvents } from '@/core/events/domain-events'
import { VacanciesRepository } from '@/domain/application/repositories/vacancies-repository'
import type { Vacancy } from '@/domain/enterprise/entities/vacancy'

import { Vacancy as TypeOrmVacancy } from '../entities/vacancy.entity'
import { TypeOrmVacancyMapper } from '../mappers/typeorm-vacancy-mapper'

@Injectable()
export class TypeOrmVacanciesRepository implements VacanciesRepository {
  constructor(
    @InjectRepository(TypeOrmVacancy)
    private readonly repository: Repository<TypeOrmVacancy>
  ) {}

  async findById(id: string): Promise<Vacancy | null> {
    const vacancy = await this.repository.findOne({ where: { id } })

    if (!vacancy) {
      return null
    }

    return TypeOrmVacancyMapper.toDomain(vacancy)
  }

  async create(vacancy: Vacancy): Promise<void> {
    await this.repository.save(TypeOrmVacancyMapper.toTypeOrm(vacancy))

    await DomainEvents.dispatchEventsForAggregate(vacancy.id)
  }

  async save(vacancy: Vacancy): Promise<void> {
    await this.repository.save(TypeOrmVacancyMapper.toTypeOrm(vacancy))

    await DomainEvents.dispatchEventsForAggregate(vacancy.id)
  }
}
