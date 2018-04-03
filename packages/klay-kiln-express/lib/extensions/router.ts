import {IDatabaseExecutor} from 'klay-db'
import {IKiln, IKilnExtension, IKilnModel} from 'klay-kiln'
import {createRouter} from '../helpers/create-router'
import {
  ActionType,
  DEFAULT_DATABASE_EXTENSION,
  EXPRESS_ROUTER,
  IRouter,
  IRouterOptions,
  IRoutes,
  ValidateIn,
} from '../typedefs'

export const CRUD_ROUTES: IRoutes = {
  'GET /': {type: ActionType.List},
  'POST /search': {type: ActionType.List, expectQueryIn: ValidateIn.Body},

  'POST /': {type: ActionType.Create},
  'PUT /': {type: ActionType.Update, byId: false},
  'DELETE /': {type: ActionType.Destroy, byId: false},

  'POST /bulk': {type: ActionType.Create, byList: true},
  'PUT /bulk': {type: ActionType.Update, byId: false, byList: true},
  'DELETE /bulk': {type: ActionType.Destroy, byId: false, byList: true},

  'GET /:id': {type: ActionType.Read},
  'PUT /:id': {type: ActionType.Update},
  'DELETE /:id': {type: ActionType.Destroy},
}

export class RouterExtension implements IKilnExtension<IRouter, IRouterOptions> {
  public name: string
  public defaultOptions: IRouterOptions

  public constructor(options: IRouterOptions) {
    this.name = EXPRESS_ROUTER
    this.defaultOptions = {
      databaseExtension: DEFAULT_DATABASE_EXTENSION,
      ...options,
    }
  }

  // tslint:disable-next-line
  public build(kilnModel: IKilnModel, options: IRouterOptions, kiln: IKiln): IRouter {
    const executor = kiln.build(kilnModel.name, options.databaseExtension!) as IDatabaseExecutor
    return createRouter(options, kilnModel, executor)
  }
}
