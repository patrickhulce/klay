import {assign} from 'lodash'
import {IValidationResult, IValidationResultError} from '../typedefs'
import {Assertions} from './assertions'

export class AssertionError extends Error {
  public constructor(message: string, extras?: object) {
    super(message)
    this.name = 'AssertionError'
    assign(this, extras)
  }

  public asValidationResultError(validationResult?: IValidationResult): IValidationResultError {
    const resultError: IValidationResultError = {message: this.message}
    if (validationResult && validationResult.pathToValue.length) {
      resultError.path = validationResult.pathToValue
    }

    resultError.error = this
    return resultError
  }

  public static fromResultError(resultError: IValidationResultError): AssertionError {
    if (resultError.error) {
      return resultError.error as AssertionError
    }

    return new AssertionError(resultError.message, resultError)
  }
}

export const assertions = new Assertions(msg => new AssertionError(msg))
