import {assertions as modelAssertions} from './errors/model-error'
import {IModel, IModelOptions, IModelSpecification} from './typedefs'

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
}
