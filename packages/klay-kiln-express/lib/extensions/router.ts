import {Router} from 'express'
import {modelAssertions} from 'klay-core'
import {IKiln, IKilnExtension, IKilnModel} from 'klay-kiln'
import {entries, isEqual, map} from 'lodash'
import {createRoute} from '../helpers/create-route'
import {
  ActionType,
  EXPRESS_ROUTE,
  EXPRESS_ROUTER,
  HTTPMethod,
  IActionRouteOptions,
  IRoute,
  IRouteInput,
  IRouteParams,
  IRouter,
  IRouterOptions,
  IRouterRoute,
  IRoutes,
  ValidateIn,
} from '../typedefs'

const READ_ACTIONS = new Set([ActionType.List, ActionType.Read])

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
    this.defaultOptions = {...options}
  }

  // tslint:disable-next-line
  private getRoute(
    kiln: IKiln,
    kilnModel: IKilnModel,
    inputOrOptions: IRouteInput | IActionRouteOptions,
    routerOptions: IRouterOptions,
  ): IRoute {
    const actionType = (inputOrOptions as any).type
    if (typeof actionType === 'string') {
      const authorization = READ_ACTIONS.has(actionType as ActionType)
        ? routerOptions.readAuthorization
        : routerOptions.writeAuthorization
      const inheritedRouterOptions = routerOptions.defaults as IActionRouteOptions
      const routeOptions = inputOrOptions as IActionRouteOptions
      return kiln.build<IRoute, IActionRouteOptions>(kilnModel.name, EXPRESS_ROUTE, {
        ...inheritedRouterOptions,
        authorization,
        ...routeOptions,
      })
    }

    const inheritedRouterOptions = routerOptions.defaults as IRouteInput
    const routeInput = inputOrOptions as IRouteInput
    return createRoute({...inheritedRouterOptions, ...routeInput})
  }

  public build(kilnModel: IKilnModel, routerOptions: IRouterOptions, kiln: IKiln): IRouter {
    const router = Router()

    const paramHandlers: IRouteParams = {}

    const routes: IRouterRoute[] = map(routerOptions.routes, (typeOrOption, key) => {
      const [method, path] = key.split(' ')
      const routeOptions = typeof typeOrOption === 'string' ? {type: typeOrOption} : typeOrOption
      const route = this.getRoute(kiln, kilnModel, routeOptions, routerOptions)

      for (const [name, handler] of entries(route.paramHandlers)) {
        const existing = paramHandlers[name] || handler
        modelAssertions.ok(
          isEqual(existing.model.spec, handler.model.spec),
          `incompatible params model for ${name}`,
        )

        paramHandlers[name] = handler
      }

      return {
        path,
        method: method.toLowerCase() as HTTPMethod,
        options: routeOptions,
        kilnModel,
        ...route,
      }
    })

    for (const [name, handler] of entries(paramHandlers)) {
      router.param(name, handler)
    }

    for (const route of routes) {
      router[route.method](route.path, route.middleware)
    }

    return {router, routes}
  }
}
