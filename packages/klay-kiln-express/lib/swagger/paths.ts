import * as swagger from 'swagger-schema-official'
import {IRouterRoute, IRouter, ValidateIn, IActionRouteOptions, ActionType} from '../typedefs'
import {IKeyedPaths, ISwaggerSchemaCache} from './typedefs'
import {groupBy, entries, startCase} from 'lodash'
import {getParameters} from './components'

function getDefaultName(route: IRouterRoute): string {
  const singular = startCase(route.kilnModel.name)
  const plural = startCase(route.kilnModel.meta.plural!)
  const actionOpts = route.options as IActionRouteOptions
  const action = startCase(actionOpts.type)
  return actionOpts.byList || actionOpts.type === ActionType.List
    ? `${action}${plural}`
    : `${action}${singular}`
}

function buildOperation(route: IRouterRoute, cache?: ISwaggerSchemaCache): swagger.Operation {
  const name = route.options.actionName || getDefaultName(route)
  const programmaticName = name.replace(/ /g, '') + 'Payload'

  return {
    summary: name,
    parameters: [
      ...getParameters(route.paramsModel, ValidateIn.Params, cache, programmaticName),
      ...getParameters(route.queryModel, ValidateIn.Query, cache, programmaticName),
      ...getParameters(route.bodyModel, ValidateIn.Body, cache, programmaticName),
    ],
    responses: {},
  }
}

export function buildPaths(router: IRouter, cache?: ISwaggerSchemaCache): IKeyedPaths {
  const paths: IKeyedPaths = {}

  const routeGroups = groupBy(router.routes, 'path')
  for (const [routePath, routeGroup] of entries(routeGroups)) {
    const path: swagger.Path = {}
    for (const route of routeGroup) {
      path[route.method] = buildOperation(route, cache)
    }

    paths[routePath] = path
  }

  return paths
}
