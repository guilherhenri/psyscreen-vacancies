import { UseCaseError } from '@/core/errors/use-case-error'

export class VacancyNotFoundError extends Error implements UseCaseError {
  constructor() {
    super('Vacancy not found')
  }
}
