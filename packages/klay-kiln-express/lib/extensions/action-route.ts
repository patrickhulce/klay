import {IKiln, IKilnExtension, IKilnModel} from 'klay-kiln'
import {DEFAULT_DATABASE_EXTENSION, EXPRESS_ROUTE, IActionRouteOptions, IRoute} from '../typedefs'

import {IDatabaseExecutor} from 'klay-db'
import {actions} from '../actions'
import {createRoute} from '../helpers/create-route'

export class ActionRouteExtension implements IKilnExtension<IRoute, IActionRouteOptions> {
  public name: string
  public defaultOptions: IActionRouteOptions

  public constructor(options: IActionRouteOptions) {
    this.name = EXPRESS_ROUTE
    this.defaultOptions = {
      databaseExtension: DEFAULT_DATABASE_EXTENSION,
      ...options,
    }
  }

  // tslint:disable-next-line
  public build(kilnModel: IKilnModel, options: IActionRouteOptions, kiln: IKiln): IRoute {
    const action = actions.find(action => action.type === options.type)
    if (!action) {
      throw new Error(`Could not find action: ${options.type}`)
    }

    options = {...action.defaultOptions, ...options}

    const executor = kiln.build(kilnModel.name, options.databaseExtension!) as IDatabaseExecutor

    const defaultAuthorization = action.authorization(kilnModel, options)
    const authorization = options.authorization
      ? {...defaultAuthorization, ...options.authorization}
      : undefined

    return createRoute({
      authorization,
      queryModel: action.queryModel(kilnModel, options),
      bodyModel: action.bodyModel(kilnModel, options),
      paramsModel: action.paramsModel(kilnModel, options),
      handler: action.handler(kilnModel, options, executor),
      lookupActionTarget: action.lookupActionTarget(kilnModel, options, executor),
      middleware: options.middleware,
    })
  }
}
