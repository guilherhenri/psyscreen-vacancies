import { Controller } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import {
  GlobalErrorCodes,
  type UpdateVacancyCriteriaCommand,
  type UpdateVacancyCriteriaResult,
  VacancyCommandTopics,
  type VacancyErrorCode,
  VacancyErrorCodes,
} from '@psyscreen/contracts'

import { VacancyNotFoundError } from '@/domain/application/use-cases/errors/vacancy-not-found'
import { UpdateVacancyCriteria } from '@/domain/application/use-cases/update-vacancy-criteria'

@Controller()
export class UpdateVacancyCriteriaCommandHandler {
  constructor(private readonly updateVacancyCriteria: UpdateVacancyCriteria) {}

  @MessagePattern(VacancyCommandTopics.UPDATE_CRITERIA)
  async handle(
    @Payload() command: UpdateVacancyCriteriaCommand
  ): Promise<UpdateVacancyCriteriaResult> {
    const result = await this.updateVacancyCriteria.execute(command)

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
      data: result.value,
    }
  }
}
