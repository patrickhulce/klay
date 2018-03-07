import {IModel} from 'klay'
import {pick} from 'lodash'
import {
  IAdditionalMiddleware,
  IAnontatedHandler,
  IRoute,
  IRouteInput,
  ValidateIn,
} from '../typedefs'
import {createValidationMiddleware} from './validation-middleware'

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
  const models = pick(input, ['queryModel', 'paramsModel', 'bodyModel'])
  const middleware: IAnontatedHandler[] = []

  extendMiddleware(middleware, inputMiddleware.preValidation)
  extendMiddleware(middleware, ValidateIn.Params, models.paramsModel)
  extendMiddleware(middleware, ValidateIn.Query, models.queryModel)
  extendMiddleware(middleware, ValidateIn.Body, models.bodyModel)
  extendMiddleware(middleware, inputMiddleware.postValidation)
  extendMiddleware(middleware, input.handler)
  extendMiddleware(middleware, inputMiddleware.postResponse)

  return {...models, middleware}
}
