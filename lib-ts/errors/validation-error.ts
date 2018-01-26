import {pick} from 'lodash'
import {IValidationResultError} from '../typedefs'
import {ValidationResult} from '../validation-result'
import {Assertions} from './assertions'

export class ValidationError extends Error {
  public constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }

  public asValidationResultError(validationResult?: ValidationResult): IValidationResultError {
    const resultError = pick(this as any, [
      'message',
      'expected',
      'actual',
    ]) as IValidationResultError
    if (validationResult && validationResult.pathToValue.length) {
      resultError.path = validationResult.pathToValue
    }

    return resultError
  }
}

export const assertions = new Assertions(msg => new ValidationError(msg))
