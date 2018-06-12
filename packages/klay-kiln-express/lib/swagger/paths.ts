import {IModel} from 'klay-core'
import {entries, groupBy, startCase} from 'lodash'
import * as swagger from 'swagger-schema-official'

import {ActionType, IActionRouteOptions, IRouter, IRouterRoute, ValidateIn} from '../typedefs'

import {getParameters, getSchema} from './components'
import {IKeyedPaths, ISwaggerSchemaCache} from './typedefs'

function getDefaultName(route: IRouterRoute): string {
  const actionOpts = route.options as IActionRouteOptions
  const action = startCase(actionOpts.type)

  if (!route.kilnModel) return action
  const singular = startCase(route.kilnModel.name)
  const plural = startCase(route.kilnModel.meta.plural!)
  return actionOpts.byList || actionOpts.type === ActionType.List
    ? `${action} ${plural}`
    : `${action} ${singular}`
}

function getSuccessResponse(
  name: string,
  responseModel?: IModel,
  cache?: ISwaggerSchemaCache,
): swagger.Response {
  let schema: swagger.Schema | undefined
  if (responseModel) {
    schema = getSchema(responseModel, cache, `${name.replace(/ /g, '')}Response`)
  }

  return {
    description: `${name} was successful`,
    schema,
  }
}

function buildOperation(route: IRouterRoute, cache?: ISwaggerSchemaCache): swagger.Operation {
  const name = route.options.actionName || getDefaultName(route)
  const programmaticName = name.replace(/ /g, '')
  const successfulStatusCode = route.responseModel ? 200 : 204
  const successfulResponse = getSuccessResponse(name, route.responseModel, cache)

  return {
    summary: name,
    tags: route.kilnModel && [route.kilnModel.name],
    parameters: [
      ...getParameters(route.paramsModel, ValidateIn.Params, cache, `${programmaticName}Params`),
      ...getParameters(route.queryModel, ValidateIn.Query, cache, `${programmaticName}Query`),
      ...getParameters(route.bodyModel, ValidateIn.Body, cache, `${programmaticName}Payload`),
    ],
    responses: {[successfulStatusCode]: successfulResponse},
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

    const modifiedRoutePath = routePath.replace(/(.)\/$/, '$1')
    paths[modifiedRoutePath] = path
  }

  return paths
}
