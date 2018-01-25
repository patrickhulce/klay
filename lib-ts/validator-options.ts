import {forEach} from 'lodash'
import {
  IValidatorOptionsUnsafe,
  IValidatorOptions,
  IValidatorFormats,
  IValidatorCoerce,
  IValidatorValidations,
  ALL_FORMATS,
  NO_FORMAT,
  PHASES,
} from './typedefs'
import {assertions} from './errors/model-error'

export class ValidatorOptions {
  public types: string[]
  public formats: IValidatorFormats
  public coerce: IValidatorCoerce
  public validations: IValidatorValidations

  public constructor(options: IValidatorOptionsUnsafe) {
    const types = options.types || []
    const formats = options.formats || {}
    const coerce = options.coerce || {}
    const validations = options.validations || {}

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
      const formatsForType = formats[type].concat(ALL_FORMATS, NO_FORMAT)
      ValidatorOptions._fillWithKeys(coerceForType, formatsForType)
      forEach(coerceForType, (coercionMap, format) => {
        assertions.oneOf(format, formatsForType)
        forEach(coercionMap, phase => {
          assertions.oneOf(phase, PHASES)
        })
      })
    })

    assertions.typeof(validations, 'object')
    ValidatorOptions._fillWithKeys(validations, types)
    forEach(validations, (validationsForType, type) => {
      assertions.oneOf(type, types)
      assertions.typeof(validationsForType, 'object')
      const formatsForType = formats[type].concat(ALL_FORMATS, NO_FORMAT)
      ValidatorOptions._fillWithKeys(validationsForType, formatsForType, () => [])
      forEach(validationsForType, (validationsArray, format) => {
        assertions.oneOf(format, formatsForType)
        if (!Array.isArray(validationsArray)) {
          validationsForType[format] = [validationsArray]
        }
      })
    })

    this.types = types
    this.formats = formats
    this.coerce = coerce
    this.validations = validations
  }

  private static _fillWithKeys(target: any, keys: string[], fillFn?: () => any) {
    forEach(keys, key => {
      // tslint:disable-next-line
      target[key] = target[key] || (fillFn ? fillFn() : {})
    })
  }

  public static sanitize(options: IValidatorOptionsUnsafe): IValidatorOptions {
    const optionsConstructor = options.constructor as any
    const isValidatorOptions = optionsConstructor && optionsConstructor.name === 'ValidatorOptions'
    return isValidatorOptions ? (options as IValidatorOptions) : new ValidatorOptions(options)
  }
}
