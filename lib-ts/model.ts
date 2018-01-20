import {IModel, IModelOptions, IModelSpecification} from './types'

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
    if (this._options.types.indexOf(type) === -1) {
      throw new TypeError(`Unrecognized type: ${type}`)
    }

    this.spec.type = type
    return this
  }
}
