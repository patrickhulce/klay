import * as express from 'express'
import {IModel, IModelChild} from 'klay-core'
import {IDatabaseExecutor} from 'klay-db'
import {IKilnModel} from 'klay-kiln'
import {forEach, pick} from 'lodash'

import {actions} from '../actions'
import {createGrantValidationMiddleware, createValidationMiddleware} from '../middleware'
import {
  IActionRouteOptions,
  IAdditionalMiddleware,
  IAnontatedHandler,
  IAuthorizationRequired,
  IRoute,
  IRouteInput,
  IRouteParams,
  ValidateIn,
} from '../typedefs'

function wrapAsyncMiddleware(middleware?: IAnontatedHandler): IAnontatedHandler | undefined {
  if (!middleware || middleware.length >= 4) return middleware
  return (req: express.Request, res: express.Response, next: express.NextFunction): any => {
    const result = middleware(req, res, next)
    if (result && typeof result.catch === 'function') {
      result.catch(next)
    }

    return result
  }
}

function createParamHandlers(model?: IModel): IRouteParams {
  const handlers: IRouteParams = {}
  forEach(model && (model.spec.children as IModelChild[]), child => {
    const handlerFn: any = (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
      paramValue: any,
    ) => {
      const nextArgs = child.model.validate(paramValue).conforms ? [] : ['route']
      next(...nextArgs)
    }

    handlerFn.paramName = child.path
    handlerFn.model = child.model
    handlers[child.path] = handlerFn
  })

  return handlers
}

function extendMiddleware(
  base: IAnontatedHandler[],
  pathOrHandler?: ValidateIn | IAnontatedHandler | IAnontatedHandler[],
  model?: IModel,
): void {
  if (typeof pathOrHandler === 'string' && model) {
    base.push(createValidationMiddleware(model, pathOrHandler as ValidateIn))
  }

  if (typeof pathOrHandler === 'function') {
    base.push(pathOrHandler)
  }

  if (Array.isArray(pathOrHandler)) {
    base.push(...pathOrHandler)
  }
}

export function createRoute(input: IRouteInput): IRoute {
  const inputMiddleware = input.middleware || {}
  const paramHandlers = createParamHandlers(input.paramsModel)
  const models = pick(input, ['queryModel', 'paramsModel', 'bodyModel', 'responseModel'])
  const middleware: IAnontatedHandler[] = []
  const authMiddleware = input.authorization && createGrantValidationMiddleware(input.authorization)

  extendMiddleware(middleware, inputMiddleware.preValidation)
  extendMiddleware(middleware, ValidateIn.Params, models.paramsModel)
  extendMiddleware(middleware, ValidateIn.Query, models.queryModel)
  extendMiddleware(middleware, ValidateIn.Body, models.bodyModel)
  extendMiddleware(middleware, inputMiddleware.postValidation)
  extendMiddleware(middleware, wrapAsyncMiddleware(input.lookupActionTarget))
  extendMiddleware(middleware, authMiddleware)
  extendMiddleware(middleware, inputMiddleware.preResponse)
  extendMiddleware(middleware, wrapAsyncMiddleware(input.handler))
  extendMiddleware(middleware, inputMiddleware.postResponse)

  return {...models, middleware, paramHandlers}
}

export function createActionRoute(
  options: IActionRouteOptions,
  kilnModel: IKilnModel,
  executor: IDatabaseExecutor,
): IRoute {
  const action = actions.find(action => action.type === options.type)
  if (!action) {
    throw new Error(`Could not find action: ${options.type}`)
  }

  options = {...action.defaultOptions, ...options}

  const defaultAuthorization = action.authorization(kilnModel, options)

  let authorization: IAuthorizationRequired | undefined
  if (options.authorization) {
    authorization = {...defaultAuthorization, ...options.authorization}
  } else if (defaultAuthorization && defaultAuthorization.permission) {
    authorization = {...defaultAuthorization}
  }

  return createRoute({
    authorization,
    queryModel: action.queryModel(kilnModel, options),
    bodyModel: action.bodyModel(kilnModel, options),
    paramsModel: action.paramsModel(kilnModel, options),
    responseModel: action.responseModel(kilnModel, options),
    handler: action.handler(kilnModel, options, executor),
    lookupActionTarget: action.lookupActionTarget(kilnModel, options, executor),
    middleware: options.middleware,
  })
}
