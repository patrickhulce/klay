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
  UserCreate = 'user:create',
  UserProfile = 'user:profile',
  UserPassword = 'user:password',
  UserView = 'user:view',
  PostManage = 'post:manage',
}

export const SECRET = 'super-secret-for-hash'

export const configuration: IAuthConfiguration = {
  secret: SECRET,
  permissions: {
    [Permissions.AccountManage]: [Permissions.AccountView],
    [Permissions.AccountView]: [],
    [Permissions.UserManage]: [Permissions.UserCreate, Permissions.UserPassword],
    [Permissions.UserCreate]: [Permissions.UserProfile],
    [Permissions.UserProfile]: [Permissions.UserView],
    [Permissions.UserPassword]: [],
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
      {permission: Permissions.AccountManage, criteria: {id: '<%= accountId %>'}},
      {permission: Permissions.UserCreate, criteria: {accountId: '<%= accountId %>'}},
      {permission: Permissions.UserProfile, criteria: {accountId: '<%= accountId %>'}},
      {permission: Permissions.UserPassword, criteria: {id: '<%= id %>'}},
      {permission: Permissions.PostManage, criteria: {accountId: '<%= accountId %>'}},
    ],
    [AuthRoles.User]: [
      {permission: Permissions.AccountView, criteria: {id: '<%= accountId %>'}},
      {permission: Permissions.UserProfile, criteria: {id: '<%= id %>'}},
      {permission: Permissions.UserPassword, criteria: {id: '<%= id %>'}},
      {permission: Permissions.UserView, criteria: {accountId: '<%= accountId %>'}},
      {permission: Permissions.PostManage, criteria: {accountId: '<%= accountId %>'}},
    ],
    [AuthRoles.Anonymous]: [],
  },
}
