/* tslint:disable no-unsafe-any */
import {NextFunction, Request, Response} from 'express'
import {defaultModelContext, IModel} from 'klay-core'
import {IAnontatedHandler, IValidationMiddlewareOptions, ValidateIn} from '../typedefs'

export function createValidationMiddleware(
  model: IModel,
  pathInReq: ValidateIn = ValidateIn.Body,
  options: IValidationMiddlewareOptions = {},
): IAnontatedHandler {
  const arrayModel = options.allowedAsList && defaultModelContext.array().children(model)

  return function(req: Request, res: Response, next: NextFunction): void {
    const sourceData = req[pathInReq]
    const validated = req.validated || {}
    const result =
      arrayModel && Array.isArray(sourceData)
        ? arrayModel.validate(sourceData)
        : model.validate(sourceData)
    validated[pathInReq] = result.value
    req.validated = validated

    if (result.conforms) {
      next()
    } else {
      next(result.toError())
    }
  }
}
