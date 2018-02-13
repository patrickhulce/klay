import {cloneDeep, forEach, uniq} from 'lodash'
import {assertions} from './errors/model-error'
import {Validator} from './validator'
import {ValidatorOptions} from './validator-options'

import {
  ICoerceFunction,
  IModel,
  IModelAppliesFunction,
  IModelChild,
  IModelChildrenInput,
  IModelChildrenMap,
  IModelCoercionMap,
  IModelEnumOption,
  IModelSpecification,
  IModelValidationInput,
  IValidateOptions,
  IValidationResult,
  IValidatorOptions,
  IValidatorOptionsUnsafe,
  ModelHookPhase,
  ModelType,
  PHASES,
  ValidationPhase,
} from './typedefs'

export class Model {
  public readonly spec: IModelSpecification
  public readonly isKlayModel: boolean
  private readonly _options: IValidatorOptions

  public constructor(spec: IModelSpecification, options: IValidatorOptionsUnsafe) {
    this._options = ValidatorOptions.from(options)

    this.isKlayModel = true
    this.spec = cloneDeep(this._options.defaults)

    forEach(this._options.methods, (method, name) => {
      const model = this as any
      model[name] = (...args: any[]) => method(model, ...args)
    })

    if (spec.type) {
      this.type(spec.type)
    }

    forEach(spec, (value, key) => {
      const model = this as any
      if (typeof model[key] === 'function') {
        model[key](value)
      } else {
        model.spec[key] = value
      }
    })

    this._runHooks(ModelHookPhase.Construction)
  }

  public clone(): IModel {
    return new Model(cloneDeep(this.spec), this._options)
  }

  public type(type: string): IModel {
    assertions.oneOf(type, this._options.types, 'type')
    this.spec.type = type
    return this
  }

  public format(format: string): IModel {
    assertions.ok(this.spec.type, 'type must be set before format')
    assertions.oneOf(format, this._options.formats[this.spec.type!], 'format')
    this.spec.format = format
    return this
  }

  public required(required: boolean = true): IModel {
    assertions.typeof(required, 'boolean', 'required')
    this.spec.required = required
    return this
  }

  public optional(optional: boolean = true): IModel {
    assertions.typeof(optional, 'boolean', 'optional')
    this.spec.required = !optional
    return this
  }

  public nullable(nullable: boolean = true): IModel {
    assertions.typeof(nullable, 'boolean', 'nullable')
    this.spec.nullable = nullable
    return this
  }

  public strict(strict: boolean = true): IModel {
    assertions.typeof(strict, 'boolean', 'strict')
    this.spec.strict = strict
    return this
  }

  public default(value: any): IModel {
    this.spec.default = value
    return this
  }

  public min(value: number | Date): IModel {
    let valueAsNumber = value as number
    if (value instanceof Date) {
      valueAsNumber = value.getTime()
    }

    assertions.typeof(valueAsNumber, 'number', 'min')
    this.spec.min = valueAsNumber
    return this
  }

  public max(value: number | Date): IModel {
    let valueAsNumber = value as number
    if (value instanceof Date) {
      valueAsNumber = value.getTime()
    }

    assertions.typeof(valueAsNumber, 'number', 'max')
    this.spec.max = valueAsNumber
    return this
  }

  public size(value: number): IModel {
    assertions.ok(this.spec.type !== 'number', 'cannot call size on number model')
    assertions.typeof(value, 'number', 'size')
    this.spec.min = value
    this.spec.max = value
    return this
  }

  public enum(options: IModelEnumOption[]): IModel {
    assertions.typeof(options, 'array', 'enum')
    const nextOptions = this.spec.enum || []

    const type = typeof options[0]
    options.forEach((option, index) => {
      assertions.typeof(option, type, `enum.${index}`)
      if (typeof option === 'object') {
        assertions.ok(option && option.isKlayModel, 'expected enum to be a model')
      }

      nextOptions.push(option)
    })

    this.spec.enum = nextOptions
    return this
  }

  public applies(applies?: IModelAppliesFunction): IModel {
    if (typeof applies !== 'undefined') {
      assertions.typeof(applies, 'function', 'applies')
    }

    this.spec.applies = applies
    return this
  }

  public children(children: IModelChildrenInput): IModel {
    if ((children as IModel).isKlayModel) {
      assertions.ok(
        this.spec.type === ModelType.Array,
        'model type must be array when children is a model',
      )
      this.spec.children = children as IModel
      this._runHooks(ModelHookPhase.SetChildren)
      return this
    }

    // tslint:disable-next-line
    assertions.ok(children && typeof children === 'object', 'children must be an object')
    assertions.ok(
      this.spec.type === ModelType.Object,
      'model type must be object for named children',
    )

    let modelChildren: IModelChild[]
    if (Array.isArray(children)) {
      modelChildren = children as IModelChild[]
    } else {
      modelChildren = []
      Object.keys(children).forEach(path => {
        const model = (children as IModelChildrenMap)[path]
        modelChildren.push({path, model})
      })
    }

    modelChildren.forEach((child, i) => {
      assertions.typeof(child.path, 'string', `children.${i}`)
      assertions.ok(child.model.isKlayModel, `expected children.${i} to have a model`)
    })

    this.spec.children = modelChildren
    this._runHooks(ModelHookPhase.SetChildren)
    return this
  }

  public pick(paths: string[]): IModel {
    assertions.typeof(paths, 'array', 'pick')
    assertions.ok(this.spec.children, 'must have children to pick')
    assertions.typeof(this.spec.children, 'array', 'children')
    this.spec.children = (this.spec.children as IModelChild[]).filter(
      child => paths.indexOf(child.path) >= 0,
    )
    return this
  }

  public omit(paths: string[]): IModel {
    assertions.typeof(paths, 'array', 'omit')
    assertions.ok(this.spec.children, 'must have children to omit')
    assertions.typeof(this.spec.children, 'array', 'children')
    this.spec.children = (this.spec.children as IModelChild[]).filter(
      child => paths.indexOf(child.path) === -1,
    )
    return this
  }

  public merge(model: IModel): IModel {
    assertions.ok(model.isKlayModel, 'can only merge with another model')
    assertions.equal(model.spec.type, ModelType.Object, 'type')
    assertions.equal(this.spec.type, ModelType.Object, 'type')
    if (model.spec.children) {
      assertions.typeof(model.spec.children, 'array', 'children')
    }

    if (this.spec.children) {
      assertions.typeof(this.spec.children, 'array', 'children')
    }

    const thisChildren = (this.spec.children as IModelChild[]) || []
    const otherChildren = (model.spec.children as IModelChild[]) || []
    const merged = thisChildren.concat(otherChildren)
    const unique = uniq(merged.map(item => item.path))

    assertions.ok(unique.length === merged.length, 'cannot merge conflicting models')
    return this.children(merged)
  }

  public coerce(
    coerce: IModelCoercionMap | ICoerceFunction,
    phase: ValidationPhase = ValidationPhase.Parse,
  ): IModel {
    if (coerce && typeof coerce === 'object') {
      this.spec.coerce = {}
      Object.keys(coerce).forEach(phase => {
        this.coerce(coerce[phase], phase as ValidationPhase)
      })

      return this
    }

    assertions.typeof(coerce, 'function', 'coerce')
    assertions.oneOf(phase, PHASES, 'coerce.phase')
    this.spec.coerce = this.spec.coerce || {}
    this.spec.coerce[phase!] = coerce as ICoerceFunction
    return this
  }

  public validations(maybeValidations: IModelValidationInput | IModelValidationInput[]): IModel {
    let additive = false
    let validations = maybeValidations as IModelValidationInput[]
    if (!Array.isArray(maybeValidations)) {
      additive = true
      validations = [maybeValidations as IModelValidationInput]
    }

    validations.forEach((validation, index) => {
      const label = `validations.${index}`
      if (typeof validation === 'object') {
        const ctor: any = validation && validation.constructor
        // tslint:disable-next-line
        assertions.ok(ctor && ctor.name === 'RegExp', `${label} must be a function or RegExp`)
      } else {
        assertions.typeof(validation, 'function', label)
      }
    })

    const currentValidations = this.spec.validations || []
    const validationsToAssign = additive ? currentValidations.concat(validations) : validations
    this.spec.validations = validationsToAssign

    return this
  }

  public validate(value: any, options?: IValidateOptions): IValidationResult {
    const validator = new Validator(this.spec, this._options)
    return validator.validate(value, options)
  }

  private _runHooks(phase: ModelHookPhase): void {
    if (this._options.hooks[phase]) {
      this._options.hooks[phase].forEach(func => func(this))
    }
  }
}
