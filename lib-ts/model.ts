import * as _ from 'lodash'
import {assertions} from './errors/model-error'

import {
  IModel,
  IModelChild,
  IModelChildrenInput,
  IModelChildrenMap,
  IModelCoercionMap,
  IModelSpecification,
  IModelValidationInput,
  IValidationFunction,
  IValidatorOptions,
  ValidationPhase,
} from './typedefs'

const PHASES = _.values(ValidationPhase)

export class Model implements IModel {
  public readonly spec: IModelSpecification
  public readonly isKlayModel: boolean
  private readonly _options: IValidatorOptions

  public constructor(spec: IModelSpecification, options: IValidatorOptions) {
    this.spec = spec || {}
    this.isKlayModel = true
    this._options = options
  }

  public type(type: string): IModel {
    assertions.oneOf(type, this._options.types, 'type')
    this.spec.type = type
    return this
  }

  public format(format: string): IModel {
    assertions.ok(this.spec.type, 'type must be set before format')
    assertions.ok(
      this._options.formats[this.spec.type!],
      `no formats available for ${this.spec.type}`,
    )
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

  public options(options: any[]): IModel {
    assertions.typeof(options, 'array', 'options')
    const nextOptions = this.spec.options || []
    options.forEach(option => {
      if (this.spec.type === 'string' || this.spec.type === 'number') {
        assertions.typeof(option, this.spec.type, 'option')
      }

      nextOptions.push(option)
    })

    this.spec.options = nextOptions
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
    coerce: IModelCoercionMap | IValidationFunction,
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
    this.spec.coerce[phase!] = coerce as IValidationFunction
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
