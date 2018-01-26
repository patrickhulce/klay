import {assign, omit, pick, difference} from 'lodash'
import {ValidationError} from './errors/validation-error'
import {assertions} from './errors/model-error'
import {
  IIntermediateValidationResult,
  IInternalValidationResult,
  IValidationResult,
  IValidationResultError,
} from './typedefs'


const KEYS = ['value', 'conforms', 'errors', 'isFinished', 'rootValue', 'pathToValue']

export class ValidationResult implements IInternalValidationResult {
  public value: any
  public conforms: boolean
  public errors: IValidationResultError[]
  public isFinished: boolean
  public rootValue: any
  public pathToValue: string[]

  public constructor(result: IIntermediateValidationResult) {
    assertions.ok(ValidationResult.isLike(result), 'coerce functions must return ValidationResults')
    assign(this, pick(result, KEYS))
  }

  public setValue(value: any): ValidationResult {
    this.value = value
    return this
  }

  public setIsFinished(isFinished: boolean): ValidationResult {
    this.isFinished = isFinished
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
    const json = pick(this, ['value', 'conforms', 'errors'])
    json.errors = json.errors.map(err => omit(err, ['error']) as IValidationResultError)
    return json
  }

  public static is(value: any): boolean {
    return (
      typeof value === 'object' &&
      value &&
      value.constructor &&
      value.constructor.name === 'ValidationResult'
    )
  }

  public static isLike(value: any): boolean {
    return typeof value === 'object' && value && difference(KEYS, Object.keys(value)).length === 0
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
