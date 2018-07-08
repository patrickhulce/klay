import {cloneDeep, forEach, isArray, mergeWith, uniq} from 'lodash'

import {modelAssertions} from './errors/model-error'
import {
  ALL_FORMATS,
  FALLBACK_FORMAT,
  IModelHooks,
  IModelSpecification,
  IValidatorCoerce,
  IValidatorFormats,
  IValidatorMethods,
  IValidatorOptions,
  IValidatorOptionsUnsafe,
  IValidatorValidations,
  PHASES,
} from './typedefs'

export class ValidatorOptions implements IValidatorOptions {
  public types: string[]
  public formats: IValidatorFormats
  public coerce: IValidatorCoerce
  public validations: IValidatorValidations
  public methods: IValidatorMethods
  public defaults: IModelSpecification
  public hooks: IModelHooks

  public constructor(options: IValidatorOptionsUnsafe) {
    const types = cloneDeep(options.types || [])
    const formats = cloneDeep(options.formats || {})
    const coerce = cloneDeep(options.coerce || {})
    const validations = cloneDeep(options.validations || {})
    const methods = cloneDeep(options.methods || {})
    const defaults = cloneDeep(options.defaults || {})
    const hooks = cloneDeep(options.hooks || ({} as IModelHooks)) // tslint:disable-line

    modelAssertions.typeof(types, 'array')
    forEach(types, type => modelAssertions.typeof(type, 'string'))

    modelAssertions.typeof(formats, 'object')
    ValidatorOptions._fillWithKeys(formats, types, () => [])
    forEach(formats, (formats, type) => {
      modelAssertions.oneOf(type, types)
      modelAssertions.typeof(formats, 'array')
      forEach(formats, format => modelAssertions.typeof(format, 'string'))
    })

    modelAssertions.typeof(coerce, 'object')
    ValidatorOptions._fillWithKeys(coerce, types)
    forEach(coerce, (coerceForType, type) => {
      modelAssertions.oneOf(type, types)
      modelAssertions.typeof(coerceForType, 'object')
      const formatsForType = formats[type].concat(ALL_FORMATS, FALLBACK_FORMAT)
      ValidatorOptions._fillWithKeys(coerceForType, formatsForType)
      forEach(coerceForType, (coercionMap, format) => {
        modelAssertions.oneOf(format, formatsForType)
        forEach(coercionMap, (fn, phase) => {
          modelAssertions.oneOf(phase, PHASES)
        })
      })
    })

    modelAssertions.typeof(validations, 'object')
    ValidatorOptions._fillWithKeys(validations, types)
    forEach(validations, (validationsForType, type) => {
      modelAssertions.oneOf(type, types)
      modelAssertions.typeof(validationsForType, 'object')
      const formatsForType = formats[type].concat(ALL_FORMATS, FALLBACK_FORMAT)
      ValidatorOptions._fillWithKeys(validationsForType, formatsForType, () => [])
      forEach(validationsForType, (validationsArray, format) => {
        modelAssertions.oneOf(format, formatsForType)
        if (!Array.isArray(validationsArray)) {
          validationsForType[format] = [validationsArray]
        }
      })
    })

    modelAssertions.typeof(methods, 'object')
    forEach(methods, func => {
      modelAssertions.typeof(func, 'function')
    })

    modelAssertions.typeof(hooks, 'object')
    forEach(hooks, funcs => {
      modelAssertions.typeof(funcs, 'array')
      forEach(funcs, func => modelAssertions.typeof(func, 'function'))
    })

    this.types = types
    this.formats = formats
    this.coerce = coerce
    this.validations = validations as IValidatorValidations
    this.methods = methods
    this.defaults = defaults
    this.hooks = hooks
  }

  public clone(): IValidatorOptions {
    return new ValidatorOptions(this)
  }

  private static _fillWithKeys(target: any, keys: string[], fillFn?: () => any): void {
    forEach(keys, key => {
      // tslint:disable-next-line
      target[key] = target[key] || (fillFn ? fillFn() : {})
    })
  }

  public static from(options: IValidatorOptionsUnsafe): ValidatorOptions {
    const optionsConstructor = options.constructor as any
    const isValidatorOptions = optionsConstructor && optionsConstructor.name === 'ValidatorOptions'
    return isValidatorOptions ? (options as ValidatorOptions) : new ValidatorOptions(options)
  }

  public static merge(
    optionsUnsafeA: IValidatorOptionsUnsafe,
    optionsUnsafeB: IValidatorOptionsUnsafe,
    ...others: IValidatorOptionsUnsafe[]
  ): IValidatorOptions {
    let optionsToMerge = optionsUnsafeB
    if (others.length) {
      for (const otherOption of others) {
        optionsToMerge = ValidatorOptions.merge(optionsToMerge, otherOption)
      }
    }

    const optionsA = ValidatorOptions.from(optionsUnsafeA).clone()
    const optionsB = ValidatorOptions.from(optionsToMerge).clone()

    function combineArrays(dst: any, src: any): any[] | undefined {
      if (isArray(dst)) {
        return uniq(dst.concat(src))
      }
    }

    return new ValidatorOptions(mergeWith(optionsA, optionsB, combineArrays))
  }
}
