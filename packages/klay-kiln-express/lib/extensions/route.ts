import {IKiln, IKilnExtension, IKilnModel} from 'klay-kiln'
import {DEFAULT_DATABASE_EXTENSION, EXPRESS_ROUTE, IActionRouteOptions, IRoute} from '../typedefs'

import {IDatabaseExecutor} from 'klay-db'
import {createActionRoute} from '../helpers/create-route'

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
    const executor = kiln.build(kilnModel.name, options.databaseExtension!) as IDatabaseExecutor
    return createActionRoute(options, kilnModel, executor)
  }
}
