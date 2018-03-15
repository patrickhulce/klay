import {Router} from 'express'
import {IKiln, IKilnExtension, IKilnModel} from 'klay-kiln'
import {map} from 'lodash'
import {
  ActionType,
  EXPRESS_ROUTE,
  EXPRESS_ROUTER,
  HTTPMethod,
  IRoute,
  IRouteOptions,
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
  'GET /:id': {type: ActionType.Read},
  'PUT /:id': {type: ActionType.Update},
  'DELETE /:id': {type: ActionType.Destroy},
}

export class RouterExtension implements IKilnExtension<IRouter, IRouterOptions> {
  public name: string
  public defaultOptions: IRouterOptions

  public constructor(options: IRouterOptions) {
    this.name = EXPRESS_ROUTER
    this.defaultOptions = {...options}
  }

  // tslint:disable-next-line
  public build(kilnModel: IKilnModel, options: IRouterOptions, kiln: IKiln): IRouter {
    const router = Router()

    const routes = map(options.routes, (typeOrOption, key) => {
      const [method, path] = key.split(' ')
      const options = typeof typeOrOption === 'string' ? {type: typeOrOption} : typeOrOption
      const extension = kiln.build(kilnModel.name, EXPRESS_ROUTE, options) as IRoute
      return {
        path,
        method: method.toLowerCase() as HTTPMethod,
        options,
        ...extension,
      }
    })

    for (const route of routes) {
      router[route.method](route.path, route.middleware)
    }

    return {router, routes}
  }
}
