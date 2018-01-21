import {AssertionError} from './errors/assertion-error'
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
    AssertionError.oneOf(type, this._options.types, 'type')
    this.spec.type = type
    return this
  }

  public format(format: string): IModel {
    AssertionError.ok(this.spec.type, 'type must be set before format')
    AssertionError.oneOf(format, this._options.formats[this.spec.type!], 'format')
    this.spec.format = format
    return this
  }
}
