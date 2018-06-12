import * as express from 'express'
import {IModel} from 'klay-core'
import {IDatabaseExecutor, IQueryOrder} from 'klay-db'
import {IKilnModel} from 'klay-kiln'

import {
  GetCriteriaValues,
  IAuthModelOptions,
  IAuthorizationRequired,
  IGrants,
} from './auth/typedefs'
import {ISwaggerModelOptions} from './swagger/typedefs'

declare module 'klay-core/dist/typedefs' {
  export interface IModel {
    authorization(options?: IAuthModelOptions | IAuthModelOptions[]): IModel
    swagger(options?: ISwaggerModelOptions): IModel
  }

  export interface IModelSpecification {
    authorization?: IAuthModelOptions[]
    swagger?: ISwaggerModelOptions
  }
}

declare module 'express-serve-static-core' {
  /* tslint:disable */
  export interface ValidatedPayloads {
    query?: any
    params?: any
    cookies?: any
    body?: any
  }

  export interface Request {
    parsedURL?: URL
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
  Patch = 'patch',
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
  cookiesModel?: IModel
  queryModel?: IModel
  paramsModel?: IModel
  bodyModel?: IModel
  responseModel?: IModel
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
  getAffectedCriteriaValues?(
    model: IKilnModel,
    options: IActionOptions,
  ): GetCriteriaValues | undefined
  authorization(model: IKilnModel, options: IActionOptions): IAuthorizationRequired | undefined
  queryModel(model: IKilnModel, options: IActionOptions): IModel | undefined
  paramsModel(model: IKilnModel, options: IActionOptions): IModel | undefined
  bodyModel(model: IKilnModel, options: IActionOptions): IModel | undefined
  responseModel(model: IKilnModel, options: IActionOptions): IModel | undefined
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

export interface ISwaggerSpecMiddlewareOptions {
  autofillHost?: boolean
  autofillBasePath?: boolean
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
  patchProperties?: string[]
  authorization?: IAuthorizationRequired
}

export interface IActionRouteOptions extends IActionOptions {
  actionName?: string
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
  actionName?: string
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
  modelName?: string
  databaseExtension?: string
  defaults?: IActionRouteOptions & IRouteInput
  routes?: IRoutes
}

export interface IRouterRoute extends IRoute {
  path: string
  method: HTTPMethod
  options: IActionRouteOptions | IRouteInput
  kilnModel?: IKilnModel
}

export interface IRouter {
  routes: IRouterRoute[]
  router: express.Router
}

export interface IRouterMap {
  [path: string]: IRouter | IRouterOptions
}

/* Auth */
export * from './auth/typedefs'

/* Swagger */
export * from './swagger/typedefs'

/* Constants */
export const DEFAULT_DATABASE_EXTENSION = 'sql'
export const READ_ACTIONS = [ActionType.List, ActionType.Read]
export const WRITE_ACTIONS = [
  ActionType.Create,
  ActionType.Update,
  ActionType.Upsert,
  ActionType.Destroy,
]
