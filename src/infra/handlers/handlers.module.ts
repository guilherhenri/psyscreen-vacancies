import { Module } from '@nestjs/common'

import { CreateVacancy } from '@/domain/application/use-cases/create-vacancy'
import { LinkCandidateToVacancy } from '@/domain/application/use-cases/link-candidate-to-vacancy'
import { UpdateVacancy } from '@/domain/application/use-cases/update-vacancy'
import { UpdateVacancyCriteria } from '@/domain/application/use-cases/update-vacancy-criteria'

import { DatabaseModule } from '../database/database.module'
import { MessagingModule } from '../messaging/messaging.module'
import { CreateVacancyCommandHandler } from './create-vacancy-command.handler'
import { LinkCandidateToVacancyCommandHandler } from './link-candidate-to-vacancy-command.handler'
import { UpdateVacancyCommandHandler } from './update-vacancy-command.handler'
import { UpdateVacancyCriteriaCommandHandler } from './update-vacancy-criteria-command.handler'

@Module({
  imports: [DatabaseModule, MessagingModule],
  controllers: [
    CreateVacancyCommandHandler,
    UpdateVacancyCommandHandler,
    UpdateVacancyCriteriaCommandHandler,
    LinkCandidateToVacancyCommandHandler,
  ],
  providers: [
    CreateVacancy,
    UpdateVacancy,
    UpdateVacancyCriteria,
    LinkCandidateToVacancy,
  ],
})
export class HandlersModule {}
