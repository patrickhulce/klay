import {IKiln, IKilnExtension, IKilnModel} from 'klay-kiln'
import {DEFAULT_DATABASE_EXTENSION, IRoute, IRouteOptions} from '../typedefs'

import {IDatabaseExecutor} from 'klay-db'
import {actions} from '../actions'
import {createRoute} from '../helpers/create-route'

export class RouteExtension implements IKilnExtension<IRoute> {
  public name: string
  public defaultOptions: IRouteOptions

  public constructor(options: IRouteOptions) {
    this.name = 'express-route'
    this.defaultOptions = {
      databaseExtension: DEFAULT_DATABASE_EXTENSION,
      ...options,
    }
  }

  // tslint:disable-next-line
  public build(kilnModel: IKilnModel, rawOptions: object, kiln: IKiln): IRoute {
    let options = rawOptions as IRouteOptions
    const action = actions.find(action => action.type === options.type)
    if (!action) {
      throw new Error(`Could not find action: ${options.type}`)
    }

    options = {...options, ...action.defaultOptions}
    const executor = kiln.build(kilnModel.name, options.databaseExtension!) as IDatabaseExecutor
    return createRoute({
      queryModel: action.queryModel(kilnModel, options),
      bodyModel: action.bodyModel(kilnModel, options),
      paramsModel: action.paramsModel(kilnModel, options),
      handler: action.handler(kilnModel, options, executor),
      middleware: options.middleware,
    })
  }
}
