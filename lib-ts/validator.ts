import {flatten, get, omit} from 'lodash'
import {assertions as validationAssertions, ValidationError} from './errors/validation-error'
import {
  ALL_FORMATS,
  FALLBACK_FORMAT,
  ICoerceFunction,
  IModel,
  IModelChild,
  IModelSpecification,
  IModelValidationInput,
  IValidateOptions,
  IValidationResult,
  IValidationResultError,
  IValidationResultJSON,
  IValidatorOptions,
  IValidatorOptionsUnsafe,
  ModelType,
  ValidationPhase,
} from './typedefs'
import {ValidationResult} from './validation-result'
import {ValidatorOptions} from './validator-options'

export class Validator {
  private readonly _spec: IModelSpecification
  private readonly _options: IValidatorOptions

  public constructor(spec: IModelSpecification, options: IValidatorOptionsUnsafe) {
    this._spec = spec
    this._options = ValidatorOptions.from(options)
  }

  private _runValidations(
    validationResult: IValidationResult,
    fn?: ICoerceFunction | ICoerceFunction[],
  ): IValidationResult {
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
        return ValidationResult.fromResult(fn.call(this, validationResult, this._spec))
      }
    } catch (err) {
      // tslint:disable-next-line
      if (err.name !== 'ValidationError') {
        throw err
      }

      return validationResult.markAsErrored(err as ValidationError)
    }
  }

  private _findCoerceFn(phase: ValidationPhase): ICoerceFunction | undefined {
    if (this._spec.coerce && this._spec.coerce[phase]) {
      return this._spec.coerce[phase]
    }

    const typeCoercions = this._options.coerce && this._options.coerce[this._spec.type!]

    const typeCoercion = get(typeCoercions, [ALL_FORMATS, phase] as string[])
    const fallbackCoercion = get(typeCoercions, [FALLBACK_FORMAT, phase] as string[])
    const formatCoercion = get(typeCoercions, [this._spec.format!, phase] as string[])
    if (!fallbackCoercion && !formatCoercion) {
      return typeCoercion
    }

    return (input: IValidationResult) => {
      const next = this._runValidations(input, typeCoercion)
      return this._runValidations(next, formatCoercion || fallbackCoercion)
    }
  }

  private _validateDefinition(
    validationResult: IValidationResult,
  ): IValidationResult {
    const {value} = validationResult

    if (this._spec.required) {
      validationAssertions.defined(value)
    }

    const defaultValue = this._spec.default
    const hasDefault = typeof defaultValue !== 'undefined'
    const useDefault = hasDefault && typeof value === 'undefined'
    const finalValue = useDefault ? defaultValue : value
    validationResult.setValue(finalValue)

    if (!this._spec.nullable) {
      validationAssertions.nonNull(finalValue)
    }

    return validationResult
      .setValue(finalValue)
      .setIsFinished(finalValue === undefined || finalValue === null)
  }

  private _validateEnum(validationResult: IValidationResult): IValidationResult {
    if (!this._spec.enum) {
      return validationResult
    }

    const enumType = typeof this._spec.enum[0]
    if (enumType === 'string' || enumType === 'number') {
      validationAssertions.oneOf(validationResult.value, this._spec.enum)
      return validationResult
    }

    const failedValidationResults: IValidationResult[] = []
    for (const option of this._spec.enum) {
      const potentialModel = option as IModel
      const potentialValidator = new Validator(potentialModel.spec, this._options)
      const potentialResult = potentialValidator._validate(validationResult)
      if (potentialResult.conforms) {
        return validationResult.setValue(potentialResult.value)
      }

      failedValidationResults.push(potentialResult)
    }

    const coalesced = failedValidationResults.map(result => result.toJSON().errors)
    const error: IValidationResultError = {
      message: 'expected value to match an enum option',
      details: flatten(coalesced),
    }

    return validationResult
      .setConforms(false)
      .setErrors(validationResult.errors.concat(error))
      .setIsFinished(true)
  }

  private _validateChildren(
    validationResult: IValidationResult,
  ): IValidationResult {
    if (!this._spec.children) {
      return validationResult
    }

    if (this._spec.type === ModelType.Array) {
      const validationResults: IValidationResult[] = []
      const childModel = this._spec.children as IModel
      const validator = new Validator(childModel.spec, this._options)
      for (let i = 0; i < validationResult.value.length; i++) {
        const item = validationResult.value[i]
        const initial = ValidationResult.fromValue(
          item,
          validationResult.rootValue,
          validationResult.pathToValue.concat(String(i)),
        )

        validationResults.push(validator._validate(initial))
      }

      const base = validationResult.clone().setValue([])
      return ValidationResult.coalesce(base, validationResults)
    } else if (this._spec.type === ModelType.Object) {
      const validationResults: IValidationResult[] = []
      const childModels = this._spec.children as IModelChild[]
      for (const child of childModels) {
        const item = validationResult.value[child.path]
        const validator = new Validator(child.model.spec, this._options)
        const initial = ValidationResult.fromValue(
          item,
          validationResult.rootValue,
          validationResult.pathToValue.concat(child.path),
        )
        validationResults.push(validator._validate(initial))
      }

      const leftovers = omit(validationResult.value, childModels.map(item => item.path))
      const base = validationResult.clone().setValue(leftovers)
      return ValidationResult.coalesce(base, validationResults)
    }

    return validationResult
  }

  private _validateValue(validationResult: IValidationResult): IValidationResult {
    let typeValidations: IModelValidationInput[] = []
    let formatValidations: IModelValidationInput[] = []
    if (this._spec.type) {
      const validationsInOptions = this._options.validations[this._spec.type!]
      typeValidations = validationsInOptions[ALL_FORMATS]
      formatValidations = validationsInOptions[this._spec.format!]
      formatValidations = formatValidations || validationsInOptions[FALLBACK_FORMAT]
    }

    const modelValidations = this._spec.validations || []
    const allValidations = [...typeValidations, ...formatValidations, ...modelValidations]

    allValidations.forEach(validation => {
      if (typeof validation === 'function') {
        validation(validationResult, this._spec)
      } else {
        validationAssertions.typeof(validationResult.value, 'string')
        validationAssertions.match(validationResult.value, validation)
      }
    })

    return validationResult
  }

  private _validate(initialValidationResult: IValidationResult): IValidationResult {
    let validationResult = initialValidationResult.clone()
    const runValidations = (fn?: ICoerceFunction) => this._runValidations(validationResult, fn)

    validationResult = runValidations(this._findCoerceFn(ValidationPhase.Parse))
    validationResult = runValidations(this._validateDefinition)
    validationResult = runValidations(this._findCoerceFn(ValidationPhase.ValidateDefinition))
    validationResult = runValidations(this._findCoerceFn(ValidationPhase.CoerceType))
    validationResult = runValidations(this._validateChildren)
    validationResult = runValidations(this._findCoerceFn(ValidationPhase.ValidateChildren))
    validationResult = runValidations(this._validateEnum)
    validationResult = runValidations(this._findCoerceFn(ValidationPhase.ValidateEnum))
    validationResult = runValidations(this._validateValue)
    validationResult = runValidations(this._findCoerceFn(ValidationPhase.ValidateValue))

    return validationResult.setIsFinished(true)
  }

  public validate(value: any, options?: IValidateOptions): IValidationResultJSON {
    const result = this._validate(ValidationResult.fromValue(value, value, []))
    if (!result.conforms && options && options.failLoudly) {
      throw ValidationError.fromResultError(result.errors[0])
    }

    return result.toJSON()
  }
}
