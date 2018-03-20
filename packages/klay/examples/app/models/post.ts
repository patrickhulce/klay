import {modelContext} from '../model-context'
import {IModel, ValidationPhase} from '../../../lib'
import {ConstraintType, SortDirection} from '../../../lib'

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
