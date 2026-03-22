import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DataSource, type DataSourceOptions } from 'typeorm'

import { CandidateVacanciesRepository } from '@/domain/application/repositories/candidate-vacancies-repository'
import { VacanciesRepository } from '@/domain/application/repositories/vacancies-repository'

import { getDataSourceOptions } from './data-source'
import { CandidateVacancy } from './entities/candidate-vacancy.entity'
import { Vacancy } from './entities/vacancy.entity'
import { TypeOrmCandidateVacanciesRepository } from './repositories/typeorm-candidate-vacancies-repository'
import { TypeOrmVacanciesRepository } from './repositories/typeorm-vacancies-repository'
import { TypeOrmService } from './typeorm.service'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (): DataSourceOptions => getDataSourceOptions(),
      dataSourceFactory: async (options: DataSourceOptions) => {
        const dataSource = new DataSource(options)

        return await dataSource.initialize()
      },
    }),
    TypeOrmModule.forFeature([Vacancy, CandidateVacancy]),
  ],
  providers: [
    TypeOrmService,
    {
      provide: VacanciesRepository,
      useClass: TypeOrmVacanciesRepository,
    },
    {
      provide: CandidateVacanciesRepository,
      useClass: TypeOrmCandidateVacanciesRepository,
    },
  ],
  exports: [TypeOrmService, VacanciesRepository, CandidateVacanciesRepository],
})
export class DatabaseModule {}
