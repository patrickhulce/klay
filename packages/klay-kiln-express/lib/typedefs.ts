import {Handler, Router as ExpressRouter} from 'express'
import {IModel} from 'klay'
import {IDatabaseExecutor, IQueryOrder} from 'klay-db'
import {IKilnModel} from 'klay-kiln'

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

  export interface Response {
    promise?: Promise<any>
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

export enum AutomanagedPropertyBehavior {
  Omit = 'omit',
  Optional = 'optional',
}

export interface IModelSet {
  queryModel?: IModel
  paramsModel?: IModel
  bodyModel?: IModel
}

export interface IAnontatedHandler extends Handler, IModelSet {}

export interface IAction {
  type: ActionType
  defaultOptions: IActionOptions
  queryModel(model: IKilnModel, options: IActionOptions): IModel | undefined
  paramsModel(model: IKilnModel, options: IActionOptions): IModel | undefined
  bodyModel(model: IKilnModel, options: IActionOptions): IModel | undefined
  handler(
    model: IKilnModel,
    options: IActionOptions,
    executor: IDatabaseExecutor,
  ): IAnontatedHandler
}

export interface IValidationMiddlewareOptions {
  // TODO: implement list support
  allowedAsList?: boolean
}

export interface IQuerifyOptions {
  strict?: boolean
  allowQueryByEquality?: boolean | string[][]
  allowQueryByRange?: boolean | string[][]
  allowQueryByInclusion?: boolean | string[][]
}

export interface IParamifyOptions {
  idParamName?: string
}

export interface IActionOptions
  extends IValidationMiddlewareOptions,
    IQuerifyOptions,
    IParamifyOptions {
  maxLimit?: number
  defaultLimit?: number
  defaultOrder?: IQueryOrder
  byId?: boolean
  expectQueryIn?: ValidateIn
}

export interface IRouteOptions extends IActionOptions {
  type: ActionType
  databaseExtension?: string
  middleware?: IAdditionalMiddleware
}

export interface IAdditionalMiddleware {
  preValidation?: IAnontatedHandler | IAnontatedHandler[]
  postValidation?: IAnontatedHandler | IAnontatedHandler[]
  postResponse?: IAnontatedHandler | IAnontatedHandler[]
}

export interface IRouteInput extends IModelSet {
  handler: IAnontatedHandler
  middleware?: IAdditionalMiddleware
}

export interface IRoute extends IModelSet {
  middleware: IAnontatedHandler[]
}

export interface IRoutes {
  [expressPath: string]: ActionType | IRouteOptions
}

export interface IRouterOptions extends IActionOptions {
  routes?: IRoutes
}

export interface IRouterRoute extends IRoute {
  path: string
  method: HTTPMethod
}

export interface IRouter {
  routes: IRouterRoute[]
  router: ExpressRouter
}

export const DEFAULT_DATABASE_EXTENSION = 'sql'
export const EXPRESS_ROUTE = 'express-route'
export const EXPRESS_ROUTER = 'express-router'
