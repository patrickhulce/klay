import {IKiln, IKilnExtension, IKilnModel} from 'klay-kiln'
import {
  DEFAULT_DATABASE_EXTENSION,
  EXPRESS_ROUTE,
  IAnontatedHandler,
  IRoute,
  IRouteOptions,
} from '../typedefs'

import {IDatabaseExecutor} from 'klay-db'
import {actions} from '../actions'
import {createRoute} from '../helpers/create-route'

export class RouteExtension implements IKilnExtension<IRoute, IRouteOptions> {
  public name: string
  public defaultOptions: IRouteOptions

  public constructor(options: IRouteOptions) {
    this.name = EXPRESS_ROUTE
    this.defaultOptions = {
      databaseExtension: DEFAULT_DATABASE_EXTENSION,
      ...options,
    }
  }

  // tslint:disable-next-line
  public build(kilnModel: IKilnModel, options: IRouteOptions, kiln: IKiln): IRoute {
    const action = actions.find(action => action.type === options.type)
    if (!action) {
      throw new Error(`Could not find action: ${options.type}`)
    }

    options = {...action.defaultOptions, ...options}

    const executor = kiln.build(kilnModel.name, options.databaseExtension!) as IDatabaseExecutor
    const lookupActionTargetHandler = action.lookupActionTarget(kilnModel, options, executor)

    const middleware = options.middleware || {}
    if (lookupActionTargetHandler) {
      const postValidation: IAnontatedHandler[] = []
      middleware.postValidation = postValidation
        .concat(middleware.postValidation || [])
        .concat(lookupActionTargetHandler)
    }

    return createRoute({
      queryModel: action.queryModel(kilnModel, options),
      bodyModel: action.bodyModel(kilnModel, options),
      paramsModel: action.paramsModel(kilnModel, options),
      handler: action.handler(kilnModel, options, executor),
      middleware,
    })
  }
}
