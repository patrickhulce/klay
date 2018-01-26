import {assertions as validationAssertions, ValidationError} from './errors/validation-error'
import {
  ALL_FORMATS,
  ICoerceFunction,
  IModel,
  IModelValidationInput,
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
    this._options = ValidatorOptions.sanitize(options)
  }

  private _runValidations(
    validationResult: ValidationResult,
    fn?: ICoerceFunction | ICoerceFunction[],
  ): ValidationResult {
    if (validationResult.isFinished || !fn || !fn.length) {
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

      return validationResult.markAsErrored(err as ValidationError).markAsFinished()
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
    const {value, pathToValue} = validationResult
    const defaultValue = this._model.spec.default
    const hasDefault = typeof defaultValue !== 'undefined'
    const useDefault = hasDefault && typeof value === 'undefined'
    const isRequired = Boolean(this._model.spec.required)
    const isNullable = Boolean(this._model.spec.nullable)
    const pathAsString = pathToValue.length ? pathToValue.join('.') : undefined

    if (isRequired) {
      validationAssertions.defined(value, pathAsString)
    }

    if (!isNullable) {
      validationAssertions.nonNull(value, pathAsString)
    }

    return validationResult.setValue(useDefault ? defaultValue : value)
  }

  private _validateValue(validationResult: ValidationResult): ValidationResult {
    let allValidations: IModelValidationInput[] = []
    const validationsInOptions =
      this._options.validations && this._options.validations[this._model.spec.type!]

    const modelValidations = this._model.spec.validations || []

    const typeValidations = (validationsInOptions && validationsInOptions[ALL_FORMATS]) || []
    const formatValidations =
      (validationsInOptions && validationsInOptions[this._model.spec.format || NO_FORMAT]) || []
    allValidations = [...typeValidations, ...formatValidations, ...modelValidations]

    allValidations.forEach(validation => {
      if (typeof validation === 'function') {
        validation(validationResult, this._model.spec)
      } else {
        validationAssertions.typeof(
          validationResult.value,
          'string',
          validationResult.pathAsString(),
        )
        validationAssertions.match(
          validationResult.value,
          validation,
          validationResult.pathAsString(),
        )
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

    return validationResult.markAsFinished()
  }

  public validate(value: any): IValidationResult {
    return this._validate(ValidationResult.fromValue(value, value, [])).toJSON()
  }
}
