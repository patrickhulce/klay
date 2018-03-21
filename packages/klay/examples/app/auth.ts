import * as express from 'express'
import {IAuthConfiguration} from '../../lib'

export enum AuthRoles {
  Root = 'root',
  Admin = 'admin',
  User = 'user',
  Anonymous = 'anonymous',
}

export enum Permissions {
  AccountManage = 'account:manage',
  AccountView = 'account:view',
  UserManage = 'user:manage',
  UserView = 'user:view',
  PostManage = 'post:manage',
}

export const configuration: IAuthConfiguration = {
  getUserContext(req: express.Request): any {
    if (req.cookies && req.cookies.accountId) {
      return req.cookies
    } else {
      return {role: AuthRoles.Root}
    }
  },
  permissions: {
    [Permissions.AccountManage]: [Permissions.AccountView],
    [Permissions.AccountView]: [],
    [Permissions.UserManage]: [Permissions.UserView],
    [Permissions.UserView]: [],
    [Permissions.PostManage]: [],
  },
  roles: {
    [AuthRoles.Root]: [
      {permission: Permissions.AccountManage, criteria: '*'},
      {permission: Permissions.UserManage, criteria: '*'},
      {permission: Permissions.PostManage, criteria: '*'},
    ],
    [AuthRoles.Admin]: [
      {permission: Permissions.AccountManage, criteria: 'id=<%= accountId %>'},
      {permission: Permissions.UserManage, criteria: 'accountId=<%= accountId %>'},
      {permission: Permissions.PostManage, criteria: 'accountId=<%= accountId %>'},
    ],
    [AuthRoles.User]: [
      {permission: Permissions.AccountView, criteria: 'id=<%= accountId %>'},
      {permission: Permissions.UserManage, criteria: 'id=<%= id %>'},
      {permission: Permissions.UserView, criteria: 'accountId=<%= accountId %>'},
      {permission: Permissions.PostManage, criteria: 'accountId=<%= accountId %>'},
    ],
    [AuthRoles.Anonymous]: [],
  },
}
