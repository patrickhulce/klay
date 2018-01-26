import {assign, pick} from 'lodash'
import {ValidationError} from './errors/validation-error'
import {
  IIntermediateValidationResult,
  IInternalValidationResult,
  IValidationResult,
  IValidationResultError,
} from './typedefs'

export class ValidationResult implements IInternalValidationResult {
  public value: any
  public conforms: boolean
  public errors: IValidationResultError[]
  public isFinished: boolean
  public rootValue: any
  public pathToValue: string[]

  public constructor(result: IIntermediateValidationResult) {
    assign(
      this,
      pick(result, ['value', 'conforms', 'errors', 'isFinished', 'rootValue', 'pathToValue']),
    )
  }

  public setValue(value: any): ValidationResult {
    this.value = value
    return this
  }

  public markAsFinished(): ValidationResult {
    this.isFinished = true
    return this
  }

  public markAsErrored(error: ValidationError): ValidationResult {
    this.conforms = false
    this.errors = [...this.errors, error.asValidationResultError(this)]
    return this
  }

  public pathAsString(): string | undefined {
    return this.pathToValue.length ? this.pathToValue.join('.') : undefined
  }

  public toJSON(): IValidationResult {
    return pick(this, ['value', 'conforms', 'errors'])
  }

  public static is(value: any): boolean {
    return (
      typeof value === 'object' &&
      value &&
      value.constructor &&
      value.constructor.name === 'ValidationResult'
    )
  }

  public static fromResult(result: IIntermediateValidationResult): ValidationResult {
    if (ValidationResult.is(result)) {
      return result as ValidationResult
    }

    return new ValidationResult(result)
  }

  public static fromValue(value: any, rootValue: any, pathToValue: string[]): ValidationResult {
    if (ValidationResult.is(value)) {
      return value as ValidationResult
    }

    return new ValidationResult({
      value,
      conforms: true,
      errors: [],
      isFinished: false,
      rootValue: value,
      pathToValue: [],
    })
  }
}
