import {cloneDeep, forEach, isArray, mergeWith} from 'lodash'
import {assertions} from './errors/model-error'
import {
  ALL_FORMATS,
  FALLBACK_FORMAT,
  IValidatorCoerce,
  IValidatorFormats,
  IValidatorMethods,
  IValidatorOptions,
  IValidatorOptionsUnsafe,
  IValidatorValidations,
  PHASES,
} from './typedefs'

export class ValidatorOptions {
  public types: string[]
  public formats: IValidatorFormats
  public coerce: IValidatorCoerce
  public validations: IValidatorValidations
  public methods: IValidatorMethods

  public constructor(options: IValidatorOptionsUnsafe) {
    const types = cloneDeep(options.types || [])
    const formats = cloneDeep(options.formats || {})
    const coerce = cloneDeep(options.coerce || {})
    const validations = cloneDeep(options.validations || {})
    const methods = cloneDeep(options.methods || {})

    assertions.typeof(types, 'array')
    forEach(types, type => assertions.typeof(type, 'string'))

    assertions.typeof(formats, 'object')
    ValidatorOptions._fillWithKeys(formats, types, () => [])
    forEach(formats, (formats, type) => {
      assertions.oneOf(type, types)
      assertions.typeof(formats, 'array')
      forEach(formats, format => assertions.typeof(format, 'string'))
    })

    assertions.typeof(coerce, 'object')
    ValidatorOptions._fillWithKeys(coerce, types)
    forEach(coerce, (coerceForType, type) => {
      assertions.oneOf(type, types)
      assertions.typeof(coerceForType, 'object')
      const formatsForType = formats[type].concat(ALL_FORMATS, FALLBACK_FORMAT)
      ValidatorOptions._fillWithKeys(coerceForType, formatsForType)
      forEach(coerceForType, (coercionMap, format) => {
        assertions.oneOf(format, formatsForType)
        forEach(coercionMap, (fn, phase) => {
          assertions.oneOf(phase, PHASES)
        })
      })
    })

    assertions.typeof(validations, 'object')
    ValidatorOptions._fillWithKeys(validations, types)
    forEach(validations, (validationsForType, type) => {
      assertions.oneOf(type, types)
      assertions.typeof(validationsForType, 'object')
      const formatsForType = formats[type].concat(ALL_FORMATS, FALLBACK_FORMAT)
      ValidatorOptions._fillWithKeys(validationsForType, formatsForType, () => [])
      forEach(validationsForType, (validationsArray, format) => {
        assertions.oneOf(format, formatsForType)
        if (!Array.isArray(validationsArray)) {
          validationsForType[format] = [validationsArray]
        }
      })
    })

    assertions.typeof(methods, 'object')
    forEach(methods, func => {
      assertions.typeof(func, 'function')
    })

    this.types = types
    this.formats = formats
    this.coerce = coerce
    this.validations = validations
    this.methods = methods
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
  ): IValidatorOptions {
    const optionsA = ValidatorOptions.from(optionsUnsafeA).clone()
    const optionsB = ValidatorOptions.from(optionsUnsafeB).clone()

    function combineArrays(dst: any, src: any): any[] | undefined {
      if (isArray(dst)) {
        return dst.concat(src)
      }
    }

    return new ValidatorOptions(mergeWith(optionsA, optionsB, combineArrays))
  }
}
