import * as express from 'express'
import {IKiln} from 'klay-kiln'

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
  secret?: string
  getUserContext?(req: express.Request): any
  getRole?(userContext: any, req: express.Request): string | undefined
}

export interface IAuthCriteria {
  [criteriaProperty: string]: AuthCriteriaValue
}

export interface IGrants {
  role?: string
  has(permission: string, criteria?: IAuthCriteria): boolean
}

export interface IOAuthOptions {
  secret: string
  kiln?: IKiln
  databaseExtension?: string
  lookupUserContextByPassword?(username: string, password: string): Promise<object | undefined>
}
