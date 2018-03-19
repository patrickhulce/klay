import {
  Handler as ExpressHandler,
  RequestParamHandler as ExpressParamHandler,
  Router as ExpressRouter,
} from 'express'
import {IModel} from 'klay-core'
import {IDatabaseExecutor, IQueryOrder} from 'klay-db'
import {IKilnModel} from 'klay-kiln'

declare module 'express-serve-static-core' {
  /* tslint:disable */
  export interface ValidatedPayloads {
    query?: any
    params?: any
    cookies?: any
    body?: any
  }

  export interface Request {
    validated?: ValidatedPayloads
    actionTarget?: any
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
  Cookies = 'cookies',
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

export interface IAnontatedHandler extends ExpressHandler, IModelSet {}

export interface IAnnotatedParamsHandler extends ExpressParamHandler {
  paramName: string
  model: IModel
}

export interface IAction {
  type: ActionType
  defaultOptions: IActionOptions
  queryModel(model: IKilnModel, options: IActionOptions): IModel | undefined
  paramsModel(model: IKilnModel, options: IActionOptions): IModel | undefined
  bodyModel(model: IKilnModel, options: IActionOptions): IModel | undefined
  lookupActionTarget(
    model: IKilnModel,
    options: IActionOptions,
    executor: IDatabaseExecutor,
  ): IAnontatedHandler | undefined
  handler(
    model: IKilnModel,
    options: IActionOptions,
    executor: IDatabaseExecutor,
  ): IAnontatedHandler
}

export interface IValidationMiddlewareOptions {
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

export interface IActionOptions extends IQuerifyOptions, IParamifyOptions {
  maxLimit?: number
  defaultLimit?: number
  defaultOrder?: IQueryOrder
  byId?: boolean
  byList?: boolean
  expectQueryIn?: ValidateIn
}

export interface IActionRouteOptions extends IActionOptions {
  type?: ActionType
  databaseExtension?: string
  middleware?: IAdditionalMiddleware
}

export interface IAdditionalMiddleware {
  preValidation?: IAnontatedHandler | IAnontatedHandler[]
  postValidation?: IAnontatedHandler | IAnontatedHandler[]
  preResponse?: IAnontatedHandler | IAnontatedHandler[]
  postResponse?: IAnontatedHandler | IAnontatedHandler[]
}

export interface IRouteInput extends IModelSet {
  handler: IAnontatedHandler
  lookupActionTarget?: IAnontatedHandler
  middleware?: IAdditionalMiddleware
}

export interface IRouteParams {
  [paramName: string]: IAnnotatedParamsHandler
}

export interface IRoute extends IModelSet {
  paramHandlers: IRouteParams
  middleware: IAnontatedHandler[]
}

export interface IRoutes {
  [expressPath: string]: ActionType | IRouteOptions | IRouteInput
}

export interface IRouterOptions {
  defaults?: IRouteOptions | IRouteInput
  routes?: IRoutes
}

export interface IRouterRoute extends IRoute {
  path: string
  method: HTTPMethod
  options: IRouteOptions
}

export interface IRouter {
  routes: IRouterRoute[]
  router: ExpressRouter
}

/* Auth */
export interface IGrantTemplate {
  permission: string
  criteria: string[]
}

export interface IAuthRoles {
  [role: string]: IGrantTemplate[]
}

export interface IAuthPermissions {
  [permission: string]: string[]
}

export interface IAuthConfiguration {
  roles: IAuthRoles
  permissions: IAuthPermissions
}

export interface IAuthCriteria {
  [criteriaProperty: string]: string | number | boolean
}

export interface IGrants {
  has(permission: string, criteria: IAuthCriteria): boolean
}

/* Constants */
export const DEFAULT_DATABASE_EXTENSION = 'sql'
export const EXPRESS_ROUTE = 'express-route'
export const EXPRESS_ROUTER = 'express-router'
