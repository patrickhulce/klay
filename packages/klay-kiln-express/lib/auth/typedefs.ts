import * as express from 'express'
import {IModel} from 'klay-core'
import {IDatabaseExecutor, IPasswordOptions} from 'klay-db'
import {IKiln, IKilnModel} from 'klay-kiln'

import {ActionType} from '../typedefs'

export type AuthCriteriaValue = string | number | boolean

export type ChildPermissions = string

export interface IGrantTemplate {
  permission: string
  criteria: string | ICriteriaDefinition
}

export interface ICriteriaDefinition {
  [propertyToMatch: string]: AuthCriteriaValue
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
  secret?: string
  getUserContext?(req: express.Request): any
  getRoles?(userContext: any, req: express.Request): string[] | undefined
}

export interface IAuthCriteriaPropertyValues {
  [criteriaProperty: string]: AuthCriteriaValue
}

export interface IGrants<T = any> {
  roles: string[]
  userContext?: T
  has(permission: string, criteria?: IAuthCriteriaPropertyValues): boolean
  getPropertyNamesForPermission(permission: string): string[][]
}

export interface IOAuthOptions {
  secret: string
  kiln?: IKiln
  databaseExtensionName?: string
  lookupUserContextByPassword?(username: string, password: string): Promise<object | undefined>
}

export type GetCriteriaValues = (
  req: express.Request,
  criteriaProperty: string,
) => AuthCriteriaValue[]

export interface IAuthorizationRequired {
  permission: string
  getAffectedCriteriaValues?: GetCriteriaValues
}

export interface IAuthModelOptions {
  actions: ActionType[]
  permission: string
}

export interface IKilnUserAuthMetadata {
  kiln: IKiln
  databaseExtensionName: string

  usernameField: string
  passwordField: string
  passwordModel: IModel
  passwordOptions: IPasswordOptions

  userKilnModel: IKilnModel
  userExecutor: IDatabaseExecutor
}
