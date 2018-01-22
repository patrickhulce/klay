import {assertions as modelAssertions} from './errors/model-error'
import {
  IModel,
  IModelChild,
  IModelChildrenInput,
  IModelChildrenMap,
  IModelOptions,
  IModelSpecification,
} from './typedefs'

export class Model implements IModel {
  public readonly spec: IModelSpecification
  public readonly isKlayModel: boolean
  private readonly _options: IModelOptions

  public constructor(spec: IModelSpecification, options: IModelOptions) {
    this.spec = spec || {}
    this.isKlayModel = true
    this._options = options
  }

  public type(type: string): IModel {
    modelAssertions.oneOf(type, this._options.types, 'type')
    this.spec.type = type
    return this
  }

  public format(format: string): IModel {
    modelAssertions.ok(this.spec.type, 'type must be set before format')
    modelAssertions.oneOf(format, this._options.formats[this.spec.type!], 'format')
    this.spec.format = format
    return this
  }

  public required(required: boolean = true): IModel {
    modelAssertions.typeof(required, 'boolean', 'required')
    this.spec.required = required
    return this
  }

  public optional(optional: boolean = true): IModel {
    modelAssertions.typeof(optional, 'boolean', 'optional')
    this.spec.required = !optional
    return this
  }

  public nullable(nullable: boolean = true): IModel {
    modelAssertions.typeof(nullable, 'boolean', 'nullable')
    this.spec.nullable = nullable
    return this
  }

  public strict(strict: boolean = true): IModel {
    modelAssertions.typeof(strict, 'boolean', 'strict')
    this.spec.strict = strict
    return this
  }

  public default(value: any): IModel {
    this.spec.default = value
    return this
  }

  public options(options: any[]): IModel {
    modelAssertions.typeof(options, 'array', 'options')
    const nextOptions = this.spec.options || []
    options.forEach(option => {
      if (this.spec.type === 'string' || this.spec.type === 'number') {
        modelAssertions.typeof(option, this.spec.type, 'option')
      }

      nextOptions.push(option)
    })

    this.spec.options = nextOptions
    return this
  }

  public children(children: IModelChildrenInput): IModel {
    if ((children as IModel).isKlayModel) {
      modelAssertions.ok(
        this.spec.type === 'array',
        'model type must be array when children is a model',
      )
      this.spec.children = children as IModel
      return this
    }

    // tslint:disable-next-line
    modelAssertions.ok(children && typeof children === 'object', 'children must be an object')
    modelAssertions.ok(this.spec.type === 'object', 'model type must be object for named children')

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
      modelAssertions.typeof(child.path, 'string', `children.${i}`)
      modelAssertions.ok(child.model.isKlayModel, `expected children.${i} to have a model`)
    })

    this.spec.children = modelChildren
    return this
  }

  public pick(paths: string[]): IModel {
    modelAssertions.typeof(paths, 'array', 'pick')
    modelAssertions.ok(this.spec.children, 'must have children to pick')
    modelAssertions.typeof(this.spec.children, 'array', 'children')
    this.spec.children = (this.spec.children as IModelChild[]).filter(
      child => paths.indexOf(child.path) >= 0,
    )
    return this
  }

  public omit(paths: string[]): IModel {
    modelAssertions.typeof(paths, 'array', 'omit')
    modelAssertions.ok(this.spec.children, 'must have children to omit')
    modelAssertions.typeof(this.spec.children, 'array', 'children')
    this.spec.children = (this.spec.children as IModelChild[]).filter(
      child => paths.indexOf(child.path) === -1,
    )
    return this
  }
}
