import { Controller } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import {
  GlobalErrorCodes,
  type LinkCandidateToVacancyCommand,
  type LinkCandidateToVacancyResult,
  VacancyCommandTopics,
  type VacancyErrorCode,
  VacancyErrorCodes,
} from '@psyscreen/contracts'

import { VacancyNotFoundError } from '@/domain/application/use-cases/errors/vacancy-not-found'
import { LinkCandidateToVacancy } from '@/domain/application/use-cases/link-candidate-to-vacancy'

@Controller()
export class LinkCandidateToVacancyCommandHandler {
  constructor(
    private readonly linkCandidateToVacancy: LinkCandidateToVacancy
  ) {}

  @MessagePattern(VacancyCommandTopics.LINK_CANDIDATE)
  async handle(
    @Payload() command: LinkCandidateToVacancyCommand
  ): Promise<LinkCandidateToVacancyResult> {
    const result = await this.linkCandidateToVacancy.execute(command)

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
