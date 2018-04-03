import * as express from 'express'
import {modelAssertions} from 'klay-core'
import {IDatabaseExecutor} from 'klay-db'
import {IKiln, IKilnModel} from 'klay-kiln'
import {entries, forEach, isEqual, map} from 'lodash'
import {Spec as SwaggerSpec} from 'swagger-schema-official'
import {createSwaggerSpecHandler, createSwaggerUIHandler} from '../middleware'
import {buildSpecification} from '../swagger/spec'
import {
  ActionType,
  EXPRESS_ROUTER,
  HTTPMethod,
  IActionRouteOptions,
  IRoute,
  IRouteInput,
  IRouteParams,
  IRouter,
  IRouterMap,
  IRouterOptions,
  IRouterRoute,
} from '../typedefs'
import {createActionRoute, createRoute} from './create-route'

const READ_ACTIONS = new Set([ActionType.List, ActionType.Read])

export function createRouteOrActionRoute(
  inputOrOptions: IRouteInput | IActionRouteOptions,
  routerOptions: IRouterOptions,
  kilnModel?: IKilnModel,
  executor?: IDatabaseExecutor,
): IRoute {
  const actionType = (inputOrOptions as any).type
  if (typeof actionType === 'string') {
    const authorization = READ_ACTIONS.has(actionType as ActionType)
      ? routerOptions.readAuthorization
      : routerOptions.writeAuthorization
    const inheritedRouterOptions = routerOptions.defaults as IActionRouteOptions
    const routeOptions = inputOrOptions as IActionRouteOptions
    if (!kilnModel) throw new Error('Cannot create action route without kiln model')
    if (!executor) throw new Error('Cannot create action route without executor')

    return createActionRoute(
      {
        ...inheritedRouterOptions,
        authorization,
        ...routeOptions,
      },
      kilnModel,
      executor,
    )
  }

  const inheritedRouterOptions = routerOptions.defaults as IRouteInput
  const routeInput = inputOrOptions as IRouteInput
  return createRoute({...inheritedRouterOptions, ...routeInput})
}

export function createRouter(
  routerOptions: IRouterOptions,
  kilnModel?: IKilnModel,
  executor?: IDatabaseExecutor,
): IRouter {
  const router = express.Router()

  const paramHandlers: IRouteParams = {}

  const routes: IRouterRoute[] = map(routerOptions.routes, (typeOrOption, key) => {
    const [method, path] = key.split(' ')
    const routeOptions = typeof typeOrOption === 'string' ? {type: typeOrOption} : typeOrOption
    const route = createRouteOrActionRoute(routeOptions, routerOptions, kilnModel, executor)

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

export function createAndMergeRouters(
  kiln: IKiln,
  routerMap: IRouterMap,
  swaggerOverrides?: Partial<SwaggerSpec>,
): IRouter {
  const router = express.Router()
  const routes: IRouterRoute[] = []
  forEach(routerMap, (routerOrOptions, prefix) => {
    let subRouter = routerOrOptions as IRouter
    if (!Array.isArray(routerOrOptions.routes)) {
      const routerOptions = routerOrOptions as IRouterOptions
      subRouter = kiln.build<IRouter, IRouterOptions>(
        routerOptions.modelName!,
        EXPRESS_ROUTER,
        routerOptions,
      )
    }

    router.use(prefix, subRouter.router)
    subRouter.routes.forEach(route => {
      routes.push({...route, path: `${prefix}${route.path}`})
    })
  })

  const mergedRouter = {router, routes}
  const swagger = buildSpecification(kiln, mergedRouter, swaggerOverrides)
  router.get('/swagger.json', createSwaggerSpecHandler(swagger))
  router.get('/docs', createSwaggerUIHandler(swagger, './swagger.json'))
  return mergedRouter
}
