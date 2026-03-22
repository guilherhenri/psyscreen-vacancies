import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { DomainEvents } from '@/core/events/domain-events'
import { CandidateVacanciesRepository } from '@/domain/application/repositories/candidate-vacancies-repository'
import type { CandidateVacancy } from '@/domain/enterprise/entities/candidate-vacancy'

import { CandidateVacancy as TypeOrmCandidateVacancy } from '../entities/candidate-vacancy.entity'
import { TypeOrmCandidateVacancyMapper } from '../mappers/typeorm-candidate-vacancy-mapper'

@Injectable()
export class TypeOrmCandidateVacanciesRepository implements CandidateVacanciesRepository {
  constructor(
    @InjectRepository(TypeOrmCandidateVacancy)
    private readonly repository: Repository<TypeOrmCandidateVacancy>
  ) {}

  async findByCandidateAndVacancy(
    candidateId: string,
    vacancyId: string
  ): Promise<CandidateVacancy | null> {
    const link = await this.repository.findOne({
      where: { candidateId, vacancyId },
    })

    if (!link) {
      return null
    }

    return TypeOrmCandidateVacancyMapper.toDomain(link)
  }

  async findByVacancyId(vacancyId: string): Promise<CandidateVacancy[]> {
    const links = await this.repository.find({ where: { vacancyId } })

    return links.map(TypeOrmCandidateVacancyMapper.toDomain)
  }

  async create(link: CandidateVacancy): Promise<void> {
    await this.repository.save(TypeOrmCandidateVacancyMapper.toTypeOrm(link))

    await DomainEvents.dispatchEventsForAggregate(link.id)
  }
}
