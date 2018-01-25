import {pick} from 'lodash'
import {IValidationResultError} from '../typedefs'
import {Assertions} from './assertions'

export class ValidationError extends Error {
  public constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }

  public asValidationResultError(): IValidationResultError {
    return pick(this as any, ['message', 'path', 'expected', 'actual']) as IValidationResultError
  }
}

export const assertions = new Assertions(msg => new ValidationError(msg))
