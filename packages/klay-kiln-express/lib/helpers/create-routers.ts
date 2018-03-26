import * as express from 'express'
import {IKiln} from 'klay-kiln'
import {forEach} from 'lodash'
import {Spec as SwaggerSpec} from 'swagger-schema-official'
import {createSwaggerSpecHandler, createSwaggerUIHandler} from '../helpers/create-middleware'
import {buildSpecification} from '../swagger/spec'
import {EXPRESS_ROUTER, IRouter, IRouterMap, IRouterOptions, IRouterRoute} from '../typedefs'

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
