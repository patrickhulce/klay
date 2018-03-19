import * as express from 'express'
import {IModel, IModelChild} from 'klay-core'
import {forEach, pick} from 'lodash'
import {
  IAdditionalMiddleware,
  IAnontatedHandler,
  IRoute,
  IRouteInput,
  IRouteParams,
  ValidateIn,
} from '../typedefs'
import {createGrantValidationMiddleware, createValidationMiddleware} from './create-middleware'

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
  const models = pick(input, ['queryModel', 'paramsModel', 'bodyModel'])
  const middleware: IAnontatedHandler[] = []
  const authMiddleware = input.authorization && createGrantValidationMiddleware(input.authorization)

  extendMiddleware(middleware, inputMiddleware.preValidation)
  extendMiddleware(middleware, ValidateIn.Params, models.paramsModel)
  extendMiddleware(middleware, ValidateIn.Query, models.queryModel)
  extendMiddleware(middleware, ValidateIn.Body, models.bodyModel)
  extendMiddleware(middleware, inputMiddleware.postValidation)
  extendMiddleware(middleware, input.lookupActionTarget)
  extendMiddleware(middleware, authMiddleware)
  extendMiddleware(middleware, inputMiddleware.preResponse)
  extendMiddleware(middleware, input.handler)
  extendMiddleware(middleware, inputMiddleware.postResponse)

  return {...models, middleware, paramHandlers}
}
