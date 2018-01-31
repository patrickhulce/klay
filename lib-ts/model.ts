import * as _ from 'lodash'
import {assertions} from './errors/model-error'
import {ValidatorOptions} from './validator-options'

import {
  ICoerceFunction,
  IModel,
  IModelChild,
  IModelChildrenInput,
  IModelChildrenMap,
  IModelCoercionMap,
  IModelSpecification,
  IModelValidationInput,
  IValidatorOptions,
  IValidatorOptionsUnsafe,
  PHASES,
  ValidationPhase,
} from './typedefs'

export class Model implements IModel {
  public readonly spec: IModelSpecification
  public readonly isKlayModel: boolean
  private readonly _options: IValidatorOptions

  public constructor(spec: IModelSpecification, options: IValidatorOptionsUnsafe) {
    this.spec = spec || {}
    this.isKlayModel = true
    this._options = ValidatorOptions.from(options)
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

  public enum(options: any[]): IModel {
    assertions.typeof(options, 'array', 'enum')
    const nextOptions = this.spec.enum || []
    const isSimpleType = typeof options[0] === 'string' || typeof options[0] === 'number'
    options.forEach((option, index) => {
      if (typeof option === 'string' || typeof option === 'number') {
        assertions.ok(isSimpleType, 'cannot mix models and simple types in enum')
        if (this.spec.type) {
          assertions.typeof(option, this.spec.type, 'enum')
        }
      } else {
        assertions.ok(!isSimpleType, 'cannot mix models and simpel types in enum')
        assertions.ok(option && option.isKlayModel, 'expected enum option to be a model')
      }

      nextOptions.push(option)
    })

    this.spec.enum = nextOptions
    return this
  }

  public children(children: IModelChildrenInput): IModel {
    if ((children as IModel).isKlayModel) {
      assertions.ok(this.spec.type === 'array', 'model type must be array when children is a model')
      this.spec.children = children as IModel
      return this
    }

    // tslint:disable-next-line
    assertions.ok(children && typeof children === 'object', 'children must be an object')
    assertions.ok(this.spec.type === 'object', 'model type must be object for named children')

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
    assertions.equal(model.spec.type, 'object', 'type')
    assertions.equal(this.spec.type, 'object', 'type')
    if (model.spec.children) {
      assertions.typeof(model.spec.children, 'array', 'children')
    }

    if (this.spec.children) {
      assertions.typeof(this.spec.children, 'array', 'children')
    }

    const thisChildren = (this.spec.children as IModelChild[]) || []
    const otherChildren = (model.spec.children as IModelChild[]) || []
    const merged = thisChildren.concat(otherChildren)
    const uniq = _.uniq(merged.map(item => item.path))

    assertions.ok(uniq.length === merged.length, 'cannot merge conflicting models')
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
}
