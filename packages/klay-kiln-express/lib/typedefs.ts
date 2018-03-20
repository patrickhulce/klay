import * as express from 'express'
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
    grants?: IGrants
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

export interface IAnontatedHandler extends express.Handler, IModelSet {
  requiredAuthPermission?: string
}

export interface IAnnotatedParamsHandler extends express.RequestParamHandler {
  paramName: string
  model: IModel
}

export interface IAction {
  type: ActionType
  defaultOptions: IActionOptions
  getCriteriaValues(model: IKilnModel, options: IActionOptions): GetCriteriaValues | undefined
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
  authorization?: IAuthorizationRequired
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

export type GetCriteriaValues = (
  req: express.Request,
  criteriaProperty: string,
) => AuthCriteriaValue[]

export interface IAuthorizationRequired {
  permission: string
  criteria: AuthCriteriaProperties[]
  getCriteriaValues?: GetCriteriaValues
}

export interface IRouteInput extends IModelSet {
  handler: IAnontatedHandler
  lookupActionTarget?: IAnontatedHandler
  authorization?: IAuthorizationRequired
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
  [expressPath: string]: ActionType | IActionRouteOptions | IRouteInput
}

export interface IRouterOptions {
  defaults?: IActionRouteOptions & IRouteInput
  // FIXME: https://github.com/patrickhulce/klay/issues/74
  readAuthorization?: IAuthorizationRequired
  writeAuthorization?: IAuthorizationRequired
  routes?: IRoutes
}

export interface IRouterRoute extends IRoute {
  path: string
  method: HTTPMethod
  options: IActionRouteOptions
}

export interface IRouter {
  routes: IRouterRoute[]
  router: express.Router
}

/* Auth */
export type AuthCriteriaProperties = string[]

export type AuthCriteriaValue = string | number | boolean

export interface IGrantTemplate {
  permission: string
  criteria: AuthCriteriaProperties | string
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
  getUserContext?(req: express.Request): any
  getRole?(userContext: any, req: express.Request): string | undefined
}

export interface IAuthCriteria {
  [criteriaProperty: string]: AuthCriteriaValue
}

export interface IGrants {
  has(permission: string, criteria?: IAuthCriteria): boolean
}

/* Constants */
export const DEFAULT_DATABASE_EXTENSION = 'sql'
export const EXPRESS_ROUTE = 'express-route'
export const EXPRESS_ROUTER = 'express-router'
