import * as express from 'express'

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
  role?: string
  has(permission: string, criteria?: IAuthCriteria): boolean
}
