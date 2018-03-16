import {
  IValidationError,
  IValidationResult,
  IValidationResultError,
  IValidationResultJSON,
} from '../typedefs'

export class ValidationError extends Error implements IValidationError {
  public readonly isKlayValidationError: boolean
  public readonly value: any
  public readonly conforms: boolean
  public readonly errors: IValidationResultError[]
  private readonly _result: IValidationResult

  public constructor(result: IValidationResult) {
    super('value failed validation')
    this.name = 'ValidationError'
    this.isKlayValidationError = true
    this.value = result.value
    this.conforms = false
    this.errors = result.errors
    this._result = result
  }

  public toJSON(): IValidationResultJSON {
    return this._result.toJSON()
  }
}
