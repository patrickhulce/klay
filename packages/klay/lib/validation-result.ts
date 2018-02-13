import {assign, cloneDeep, difference, every, flatten, omit, pick} from 'lodash'
import {assertions} from './errors/model-error'
import {assertions as validationAssertions, ValidationError} from './errors/validation-error'
import {
  IIntermediateValidationResult,
  IValidationResult,
  IValidationResultError,
  IValidationResultJSON,
} from './typedefs'

const KEYS = ['value', 'conforms', 'errors', 'isFinished', 'rootValue', 'pathToValue']

export class ValidationResult implements IValidationResult {
  public value: any
  public conforms: boolean
  public errors: IValidationResultError[]
  public isFinished: boolean
  public rootValue: any
  public pathToValue: string[]

  public constructor(result: IIntermediateValidationResult) {
    assertions.ok(ValidationResult.isLike(result), 'coerce functions must return ValidationResults')
    assign(this, pick(result, KEYS))
    this.value = cloneDeep(result.value)
    this.rootValue = result.rootValue
  }

  public setValue(value: any): ValidationResult {
    this.value = value
    return this
  }

  public setIsFinished(isFinished: boolean): ValidationResult {
    this.isFinished = isFinished
    return this
  }

  public setConforms(conforms: boolean): ValidationResult {
    this.conforms = conforms
    if (!conforms) {
      this.isFinished = true
    }

    return this
  }

  public setErrors(errors: IValidationResultError[]): ValidationResult {
    this.errors = errors.slice()
    return this
  }

  public markAsErrored(error: ValidationError | Error): ValidationResult {
    const validationError = error as ValidationError
    const errorResult =
      typeof (error as any).asValidationResultError === 'function'
        ? validationError.asValidationResultError(this)
        : {message: error.message, error}
    this.conforms = false
    this.isFinished = true
    this.errors = this.errors.concat(errorResult)
    return this
  }

  public assert(value: boolean, message: string): ValidationResult {
    validationAssertions.ok(value, message)
    return this
  }

  public pathAsString(): string | undefined {
    return this.pathToValue.length ? this.pathToValue.join('.') : undefined
  }

  public clone(): ValidationResult {
    return new ValidationResult(this)
  }

  public toJSON(): IValidationResultJSON {
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
    return new ValidationResult({
      value,
      conforms: true,
      errors: [],
      isFinished: false,
      rootValue,
      pathToValue,
    })
  }

  public static coalesce(
    root: IValidationResult,
    validationResults: IValidationResult[],
  ): IValidationResult {
    assertions.ok(!root.isFinished, 'cannot coalesce on a finished ValidationResult')
    const conforms = every(validationResults, 'conforms')
    const errors = flatten(validationResults.map(value => value.errors))

    const value = root.value
    if (Array.isArray(value)) {
      validationResults.forEach(result => {
        const remainingKeys = result.pathToValue.slice(root.pathToValue.length)
        assertions.ok(remainingKeys.length === 1, `invalid child pathToValue: ${remainingKeys}`)
        const key = Number(remainingKeys[0])
        assertions.ok(Number.isInteger(key), `invalid child pathToValue: ${key}`)
        value[key] = result.value
      })
    } else if (typeof value === 'object' && value) {
      validationResults.forEach(result => {
        const remainingKeys = result.pathToValue.slice(root.pathToValue.length)
        assertions.ok(remainingKeys.length === 1, 'invalid child pathToValue')
        const key = remainingKeys[0]
        value[key] = result.value
      })
    } else {
      validationResults.forEach(result => {
        assertions.ok(
          result.pathToValue.length === root.pathToValue.length,
          'invalid child pathToValue',
        )
      })
    }

    return new ValidationResult({
      conforms,
      errors,
      value: root.value,
      isFinished: !conforms,
      rootValue: root.rootValue,
      pathToValue: root.pathToValue,
    })
  }
}
