import {IKlayExtension, IModel, IValidatorMethods} from 'klay-core'

import {IAuthModelOptions, ISwaggerModelOptions} from '../typedefs'

export class ExpressExtension implements IKlayExtension {
  public methods: IValidatorMethods

  public constructor() {
    this.methods = {
      authorization(model: IModel, auth: IAuthModelOptions | IAuthModelOptions[]): IModel {
        model.spec.authorization = (model.spec.authorization || []).concat(auth)
        return model
      },
      swagger(model: IModel, swaggerOpts?: ISwaggerModelOptions): IModel {
        model.spec.swagger = swaggerOpts
        return model
      },
    }
  }
}
