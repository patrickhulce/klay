import {modelContext} from '../model-context'
import {createHmac} from 'crypto'
import {assert, IModel, ValidationPhase, READ_ACTIONS, WRITE_ACTIONS} from '../../../lib'
import {ConstraintType, SortDirection} from '../../../lib'
import {AuthRoles, Permissions} from '../auth'

const SALT = 'super-secret-salt'

export interface IUser {
  id?: number
  accountId: number
  role: AuthRoles
  email: string
  password: string
  firstName: string
  lastName: string
  createdAt?: Date
  updatedAt?: Date
}

const passwordModel = modelContext
  .string()
  .max(32)
  .validations(result => {
    assert.ok(result.value !== 'password', 'password is too simple')
    return result
  })

export const userModel: IModel = modelContext
  .object()
  .children({
    id: modelContext.integerId(),
    accountId: modelContext
      .integer()
      .constrain({type: ConstraintType.Immutable})
      .constrain({type: ConstraintType.Reference, meta: {referencedModel: 'account'}}),
    role: modelContext.string().enum([AuthRoles.Admin, AuthRoles.User]),
    email: modelContext
      .email()
      .max(250)
      .constrain({type: ConstraintType.Unique}),
    password: modelContext.password({salt: SALT, model: passwordModel}),
    firstName: modelContext.string().max(100),
    lastName: modelContext.string().max(100),
    createdAt: modelContext.createdAt(),
    updatedAt: modelContext.updatedAt(),
  })
  .index([['email'], ['password']])
  .index([{property: ['updatedAt'], direction: SortDirection.Descending}])
  .authorization({
    actions: READ_ACTIONS,
    permission: Permissions.UserView,
    criteria: [['accountId']],
  })
  .authorization({
    actions: WRITE_ACTIONS,
    permission: Permissions.UserManage,
    // Allow users who have been granted UserManage to the individual user or the entire account
    criteria: [['id'], ['accountId']],
  })
