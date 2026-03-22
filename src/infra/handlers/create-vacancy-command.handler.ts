import { Controller } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import {
  type CreateVacancyCommand,
  type CreateVacancyResult,
  GlobalErrorCodes,
  VacancyCommandTopics,
} from '@psyscreen/contracts'

import { CreateVacancy } from '@/domain/application/use-cases/create-vacancy'

@Controller()
export class CreateVacancyCommandHandler {
  constructor(private readonly createVacancy: CreateVacancy) {}

  @MessagePattern(VacancyCommandTopics.CREATE)
  async handle(
    @Payload() command: CreateVacancyCommand
  ): Promise<CreateVacancyResult> {
    const result = await this.createVacancy.execute(command)

    if (result.isLeft()) {
      return {
        success: false,
        error: {
          code: GlobalErrorCodes.UNEXPECTED_ERROR,
          message: 'Failed to create vacancy',
        },
      }
    }

    const { vacancy } = result.value

    return {
      success: true,
      data: { vacancyId: vacancy.id.toString() },
    }
  }
}
