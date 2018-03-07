import {Handler, NextFunction, Request, Response, Router as ExpressRouter} from 'express'
import {IModel, IValidationResult} from 'klay'
import {IKiln, IKilnModel} from 'klay-kiln'

declare module 'express-serve-static-core' {
  /* tslint:disable */
  export interface ValidatedPayloads {
    query?: any
    params?: any
    body?: any
  }

  export interface Request {
    validated?: ValidatedPayloads
  }
  /* tslint:enable */
}

export enum HTTPMethod {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  PATCH = 'patch',
  DELETE = 'delete',
}

export enum ActionType {
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Destroy = 'destroy',
  List = 'list',
  Upsert = 'upsert',
}

export enum ValidateIn {
  Query = 'query',
  Params = 'params',
  Body = 'body',
}

export interface IModelSet {
  queryModel?: IModel
  paramsModel?: IModel
  bodyModel?: IModel
}

export interface IAnontatedHandler extends Handler, IModelSet {
}

export interface IAction {
  type: ActionType
  defaultOptions: IActionOptions
  queryModel(model: IKilnModel, options: IActionOptions): IModel | undefined
  paramsModel(model: IKilnModel, options: IActionOptions): IModel | undefined
  bodyModel(model: IKilnModel, options: IActionOptions): IModel | undefined
  handler(model: IKilnModel, options: IActionOptions, kiln: IKiln): IAnontatedHandler
}

export interface IActionOptions {
  allowQueryByEquality: boolean | string[][]
  allowQueryByRange: boolean | string[][]
}

export interface IAdditionalMiddleware {
  preValidation?: IAnontatedHandler | IAnontatedHandler[]
  postValidation?: IAnontatedHandler | IAnontatedHandler[]
  postResponse?: IAnontatedHandler | IAnontatedHandler[]
}

export type ValidationErrorHandler = (
  result: IValidationResult,
  req: Request,
  res: Response,
  next: NextFunction,
) => void

export interface IValidationMiddlewareOptions {
  // TODO: implement list support
  // allowedAsList?: boolean
  handleError?: ValidationErrorHandler
}

export interface IRouteInput extends IModelSet {
  handler: IAnontatedHandler
  middleware?: IAdditionalMiddleware
}

export interface IRoute extends IModelSet {
  middleware: IAnontatedHandler[]
}

export interface IRouterRoute extends IRoute {
  path: string
  method: HTTPMethod
}

export interface IRouter {
  routes: IRouterRoute[]
  router: ExpressRouter
}
