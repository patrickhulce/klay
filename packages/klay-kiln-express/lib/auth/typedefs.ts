import * as express from 'express'
import {IKiln} from 'klay-kiln'
import { ActionType } from '..'

export type AuthCriteriaProperty = string

export type AuthCriteriaPropertySet = AuthCriteriaProperty[]

export type AuthCriteriaValue = string | number | boolean

export type ChildPermissions = string

export interface IGrantTemplate {
  permission: string
  criteria: AuthCriteriaPropertySet | string
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

export interface IGrants {
  roles: string[]
  has(permission: string, criteria?: IAuthCriteriaPropertyValues): boolean
}

export interface IOAuthOptions {
  secret: string
  kiln?: IKiln
  databaseExtension?: string
  lookupUserContextByPassword?(username: string, password: string): Promise<object | undefined>
}

export type GetCriteriaValues = (
  req: express.Request,
  criteriaProperty: string,
) => AuthCriteriaValue[]

export interface IAuthorizationRequired {
  permission: string
  criteria: AuthCriteriaPropertySet[]
  getAffectedCriteriaValues?: GetCriteriaValues
}

export interface IAuthModelOptions {
  actions: ActionType[]
  permission: string
  criteria: AuthCriteriaPropertySet[]
}
