import {modelContext} from '../model-context'
import {createHmac} from 'crypto'
import {
  IModel,
  ValidationPhase,
  ConstraintType,
  SortDirection,
  READ_ACTIONS,
  WRITE_ACTIONS,
} from '../../../lib'
import {values, kebabCase} from 'lodash'
import {Permissions} from '../auth'

export enum AccountPlan {
  Free = 'free',
  Bronze = 'bronze',
  Silver = 'silver',
  Gold = 'gold',
}

export interface IAccount {
  id?: number
  name: string
  slug: string
  plan: AccountPlan
  createdAt?: Date
  updatedAt?: Date
}

export const accountModel: IModel = modelContext
  .object()
  .children({
    id: modelContext.integerId(),
    name: modelContext.string().max(100),
    slug: modelContext
      .string()
      .max(100)
      .optional()
      .coerce(value => value.setValue(value.value || kebabCase(value.rootValue.name)))
      .constrain({type: ConstraintType.Unique}),
    plan: modelContext.string().enum(values(AccountPlan)),
    createdAt: modelContext.createdAt(),
    updatedAt: modelContext.updatedAt(),
  })
  .index([['name']])
  .index([{property: ['updatedAt'], direction: SortDirection.Descending}])
  .authorization({actions: READ_ACTIONS, permission: Permissions.AccountView, criteria: [['id']]})
  .authorization({
    actions: WRITE_ACTIONS,
    permission: Permissions.AccountManage,
    criteria: [['id']],
  })
