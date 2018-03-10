/* tslint:disable no-unsafe-any */
import {NextFunction, Request, Response} from 'express'
import {IModel, IValidationResult} from 'klay'
import {
  IAnontatedHandler,
  IValidationMiddlewareOptions,
  ValidateIn,
} from '../typedefs'

export function createValidationMiddleware(
  model: IModel,
  pathInReq: ValidateIn = ValidateIn.Body,
  options: IValidationMiddlewareOptions = {},
): IAnontatedHandler {
  return function(req: Request, res: Response, next: NextFunction): void {
    const sourceData = req[pathInReq]
    const validated = req.validated || {}
    const result = model.validate(sourceData)
    validated[pathInReq] = result.value
    req.validated = validated

    if (result.conforms) {
      next()
    } else {
      next(result.toError())
    }
  }
}
