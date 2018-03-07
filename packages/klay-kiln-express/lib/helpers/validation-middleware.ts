/* tslint:disable no-unsafe-any */
import {NextFunction, Request, Response} from 'express'
import {IModel, IValidationResult} from 'klay'
import {
  IAnontatedHandler,
  IValidationMiddlewareOptions,
  ValidateIn,
  ValidationErrorHandler,
} from '../typedefs'

function defaultErrorHandler(
  result: IValidationResult,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  next(result.toError())
}

export function defaultJSONHandler(result: IValidationResult, req: Request, res: Response): void {
  res.status(400)
  res.json(result.toJSON())
}

export function createValidationMiddleware(
  model: IModel,
  pathInReq: ValidateIn = ValidateIn.Body,
  options: IValidationMiddlewareOptions = {},
): IAnontatedHandler {
  return function(req: Request, res: Response, next: NextFunction): void {
    const errorHandler = options.handleError || defaultErrorHandler
    const sourceData = req[pathInReq]
    const validated = req.validated || {}
    const result = model.validate(sourceData)
    validated[pathInReq] = result.value
    req.validated = validated

    if (result.conforms) {
      next()
    } else {
      errorHandler(result, req, res, next)
    }
  }
}
