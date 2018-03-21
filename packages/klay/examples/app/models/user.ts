import {modelContext} from '../model-context'
import {createHmac} from 'crypto'
import {IModel, ValidationPhase} from '../../../lib'
import {ConstraintType, SortDirection} from '../../../lib'
import { AuthRoles } from '../auth';

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
    password: modelContext
      .string()
      .max(40)
      .coerce(value => {
        if (/^[a-f0-9]{40}$/.test(value.value)) return value
        const hash = createHmac('sha1', SALT).update(value.value)
        const hashed = hash.digest('hex')
        return value.setValue(hashed)
      }, ValidationPhase.ValidateValue),
    firstName: modelContext.string().max(100),
    lastName: modelContext.string().max(100),
    createdAt: modelContext.createdAt(),
    updatedAt: modelContext.updatedAt(),
  })
  .index([['email'], ['password']])
  .index([{property: ['updatedAt'], direction: SortDirection.Descending}])
