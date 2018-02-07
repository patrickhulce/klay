import {assign, pick} from 'lodash'
import {IValidationResult, IValidationResultError} from '../typedefs'
import {Assertions} from './assertions'

export class ValidationError extends Error {
  public constructor(message: string, extras?: object) {
    super(message)
    this.name = 'ValidationError'
    assign(this, extras)
  }

  public asValidationResultError(validationResult?: IValidationResult): IValidationResultError {
    const resultError = pick(this as any, [
      'message',
      'expected',
      'actual',
    ]) as IValidationResultError
    if (validationResult && validationResult.pathToValue.length) {
      resultError.path = validationResult.pathToValue
    }

    resultError.error = this
    return resultError
  }

  public static fromResultError(resultError: IValidationResultError): ValidationError {
    if (resultError.error) {
      return resultError.error as ValidationError
    }

    return new ValidationError(resultError.message, resultError)
  }
}

export const assertions = new Assertions(msg => new ValidationError(msg))
