import {ValidatorOptions} from './validator-options'
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


export class Validator {
  private readonly _model: IModel
  private readonly _options: IValidatorOptions

  public constructor(model: IModel, options: IValidatorOptionsUnsafe) {
    this._model = model
    this._options = ValidatorOptions.sanitize(options)
  }

  private _runValidations(
    validationResult: IValidationResult,
    rootValue: any,
    pathToValue: string[],
    fn?: ICoerceFunction | ICoerceFunction[],
  ): IValidationResult {
    if (validationResult.isFinished || !fn || !fn.length) {
      return validationResult
    }

    try {
      if (Array.isArray(fn)) {
        let finalResult = validationResult
        fn.forEach(fn => {
          finalResult = this._runValidations(validationResult, rootValue, pathToValue, fn)
        })
        return finalResult
      } else {
        // tslint:disable-next-line
        return fn.call(this, validationResult.value, rootValue, pathToValue, this._model.spec)
      }
    } catch (err) {
      // tslint:disable-next-line
      if (err.name !== 'ValidationError') {
        throw err
      }

      return {
        conforms: false,
        isFinished: true,
        value: validationResult.value,
        errors: [(err as ValidationError).asValidationResultError()],
      }
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

  private _validateDefinition(
    value: any,
    rootValue: any,
    pathToValue: string[],
  ): IValidationResult {
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

    return {
      value: useDefault ? defaultValue : value,
      isFinished: false,
      conforms: true,
      errors: [],
    }
  }

  private _validateValue(value: any, rootValue: any, pathToValue: string[]): IValidationResult {
    let allValidations: IModelValidationInput[] = []
    const validationsInOptions =
      this._options.validations && this._options.validations[this._model.spec.type!]

    const modelValidations = this._model.spec.validations || []

    const typeValidations = (validationsInOptions && validationsInOptions[ALL_FORMATS]) || []
    const formatValidations =
      (validationsInOptions && validationsInOptions[this._model.spec.format || NO_FORMAT]) || []
    allValidations = [...typeValidations, ...formatValidations, ...modelValidations]

    const validationResult: IValidationResult = {
      value,
      isFinished: false,
      conforms: true,
      errors: [],
    }
    allValidations.forEach(validation => {
      const value = validationResult.value
      if (typeof validation === 'function') {
        validation(value, rootValue, pathToValue, this._model.spec)
      } else {
        validationAssertions.typeof(value, 'string', pathToValue.join('.'))
        validationAssertions.match(value, validation, pathToValue.join('.'))
      }
    })

    return validationResult
  }

  private _validate(value: any, rootValue: any, pathToValue: string[]): IValidationResult {
    let validationResult: IValidationResult = {value, conforms: true, isFinished: false, errors: []}
    const runValidation = (fn?: ICoerceFunction) =>
      this._runValidations(validationResult, rootValue, pathToValue, fn)

    validationResult = runValidation(this._findCoerceFn(ValidationPhase.Parse))
    validationResult = runValidation(this._validateDefinition)
    validationResult = runValidation(this._findCoerceFn(ValidationPhase.ValidateDefinition))
    validationResult = runValidation(this._findCoerceFn(ValidationPhase.TypeCoerce))
    validationResult = runValidation(this._findCoerceFn(ValidationPhase.FormatCoerce))
    validationResult = runValidation(this._validateValue)
    validationResult = runValidation(this._findCoerceFn(ValidationPhase.ValidateValue))

    return {...validationResult, isFinished: true}
  }

  public validate(value: any): IValidationResult {
    return this._validate(value, value, [])
  }
}
