import * as express from 'express'
import {IKiln} from 'klay-kiln'
import {forEach} from 'lodash'
import {EXPRESS_ROUTER, IRouter, IRouterMap, IRouterOptions, IRouterRoute} from '../typedefs'

export function createAndMergeRouters(kiln: IKiln, routerMap: IRouterMap): IRouter {
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

  return {router, routes}
}
