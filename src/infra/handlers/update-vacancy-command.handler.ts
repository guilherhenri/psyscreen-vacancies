import { Controller } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import {
  GlobalErrorCodes,
  type UpdateVacancyCommand,
  type UpdateVacancyResult,
  VacancyCommandTopics,
  type VacancyErrorCode,
  VacancyErrorCodes,
} from '@psyscreen/contracts'

import { VacancyNotFoundError } from '@/domain/application/use-cases/errors/vacancy-not-found'
import { UpdateVacancy } from '@/domain/application/use-cases/update-vacancy'

@Controller()
export class UpdateVacancyCommandHandler {
  constructor(private readonly updateVacancy: UpdateVacancy) {}

  @MessagePattern(VacancyCommandTopics.UPDATE)
  async handle(
    @Payload() command: UpdateVacancyCommand
  ): Promise<UpdateVacancyResult> {
    const result = await this.updateVacancy.execute(command)

    if (result.isLeft()) {
      const domainError = result.value

      let code: VacancyErrorCode
      const message = domainError.message

      switch (domainError.constructor) {
        case VacancyNotFoundError:
          code = VacancyErrorCodes.VACANCY_NOT_FOUND
          break
        default:
          code = GlobalErrorCodes.UNEXPECTED_ERROR
      }

      return {
        success: false,
        error: {
          code,
          message,
        },
      }
    }

    return {
      success: true,
      data: null,
    }
  }
}
