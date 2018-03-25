import {
  IKlayExtension,
  IModel,
  IValidatorMethods,
} from 'klay-core'
import {ISwaggerModelOptions} from '../typedefs'

export class ExpressExtension implements IKlayExtension {
  public methods: IValidatorMethods

  public constructor() {
    this.methods = {
      swagger(model: IModel, swaggerOpts?: ISwaggerModelOptions): IModel {
        model.spec.swagger = swaggerOpts
        return model
      },
    }
  }
}
