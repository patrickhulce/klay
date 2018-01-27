import {assertions as validationAssertions, ValidationError} from './errors/validation-error'
import {
  ALL_FORMATS,
  ICoerceFunction,
  IModel,
  IModelValidationInput,
  IValidateOptions,
  IValidationResult,
  IValidatorOptions,
  IValidatorOptionsUnsafe,
  NO_FORMAT,
  ValidationPhase,
} from './typedefs'
import {ValidationResult} from './validation-result'
import {ValidatorOptions} from './validator-options'

export class Validator {
  private readonly _model: IModel
  private readonly _options: IValidatorOptions

  public constructor(model: IModel, options: IValidatorOptionsUnsafe) {
    this._model = model
    this._options = ValidatorOptions.from(options)
  }

  private _runValidations(
    validationResult: ValidationResult,
    fn?: ICoerceFunction | ICoerceFunction[],
  ): ValidationResult {
    const fnIsEmptyArray = Array.isArray(fn) && !fn.length
    if (validationResult.isFinished || !fn || fnIsEmptyArray) {
      return validationResult
    }

    try {
      if (Array.isArray(fn)) {
        let finalResult = validationResult
        fn.forEach(fn => {
          finalResult = this._runValidations(validationResult, fn)
        })
        return finalResult
      } else {
        // tslint:disable-next-line
        return ValidationResult.fromResult(fn.call(this, validationResult, this._model.spec))
      }
    } catch (err) {
      // tslint:disable-next-line
      if (err.name !== 'ValidationError') {
        throw err
      }

      return validationResult.markAsErrored(err as ValidationError).setIsFinished(true)
    }
  }

  private _findCoerceFn(phase: ValidationPhase): ICoerceFunction | undefined {
    if (this._model.spec.coerce && this._model.spec.coerce[phase]) {
      return this._model.spec.coerce[phase]
    }

    const typeCoercions = this._options.coerce && this._options.coerce[this._model.spec.type!]
    const formatCoercions = typeCoercions && typeCoercions[this._model.spec.format || NO_FORMAT]
    if (formatCoercions && formatCoercions[phase]) {
      return formatCoercions[phase]
    }

    return typeCoercions && typeCoercions[ALL_FORMATS] && typeCoercions[ALL_FORMATS][phase]
  }

  private _validateDefinition(validationResult: ValidationResult): ValidationResult {
    const {value} = validationResult

    if (this._model.spec.required) {
      validationAssertions.defined(value)
    }

    const defaultValue = this._model.spec.default
    const hasDefault = typeof defaultValue !== 'undefined'
    const useDefault = hasDefault && typeof value === 'undefined'
    const finalValue = useDefault ? defaultValue : value
    validationResult.setValue(finalValue)

    if (!this._model.spec.nullable) {
      validationAssertions.nonNull(finalValue)
    }

    return validationResult
      .setValue(finalValue)
      .setIsFinished(finalValue === undefined || finalValue === null)
  }

  private _validateValue(validationResult: ValidationResult): ValidationResult {
    let typeValidations: IModelValidationInput[] = []
    let formatValidations: IModelValidationInput[] = []
    if (this._model.spec.type) {
      const validationsInOptions = this._options.validations[this._model.spec.type!]
      typeValidations = validationsInOptions[ALL_FORMATS]
      formatValidations = validationsInOptions[this._model.spec.format || NO_FORMAT]
    }

    const modelValidations = this._model.spec.validations || []
    const allValidations = [...typeValidations, ...formatValidations, ...modelValidations]

    allValidations.forEach(validation => {
      if (typeof validation === 'function') {
        validation(validationResult, this._model.spec)
      } else {
        validationAssertions.typeof(validationResult.value, 'string')
        validationAssertions.match(validationResult.value, validation)
      }
    })

    return validationResult
  }

  private _validate(initialValidationResult: ValidationResult): ValidationResult {
    let validationResult = initialValidationResult
    const runValidations = (fn?: ICoerceFunction) => this._runValidations(validationResult, fn)

    validationResult = runValidations(this._findCoerceFn(ValidationPhase.Parse))
    validationResult = runValidations(this._validateDefinition)
    validationResult = runValidations(this._findCoerceFn(ValidationPhase.ValidateDefinition))
    validationResult = runValidations(this._findCoerceFn(ValidationPhase.TypeCoerce))
    validationResult = runValidations(this._findCoerceFn(ValidationPhase.FormatCoerce))
    validationResult = runValidations(this._validateValue)
    validationResult = runValidations(this._findCoerceFn(ValidationPhase.ValidateValue))

    return validationResult.setIsFinished(true)
  }

  public validate(value: any, options?: IValidateOptions): IValidationResult {
    const result = this._validate(ValidationResult.fromValue(value, value, []))
    if (!result.conforms && options && options.failLoudly) {
      throw ValidationError.fromResultError(result.errors[0])
    }

    return result.toJSON()
  }
}
