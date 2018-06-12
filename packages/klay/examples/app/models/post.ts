import {modelContext} from '../model-context'
import {IModel, ValidationPhase, ConstraintType, SortDirection, WRITE_ACTIONS} from '../../../lib'
import {Permissions} from '../auth'

export const postModel: IModel = modelContext
  .object()
  .children({
    id: modelContext.integerId(),
    accountId: modelContext
      .integer()
      .constrain({type: ConstraintType.Immutable})
      .constrain({type: ConstraintType.Reference, meta: {referencedModel: 'account'}}),
    userId: modelContext
      .integer()
      .constrain({type: ConstraintType.Reference, meta: {referencedModel: 'user'}})
      .constrain({type: ConstraintType.Immutable}),
    title: modelContext.string().max(250),
    body: modelContext.string(),
    private: modelContext
      .boolean()
      .default(false)
      .optional(),
    createdAt: modelContext.createdAt(),
    updatedAt: modelContext.updatedAt(),
  })
  .index([['userId'], {property: ['updatedAt'], direction: SortDirection.Descending}])
  .authorization({actions: WRITE_ACTIONS, permission: Permissions.PostManage})
