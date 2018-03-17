import {modelContext} from '../model-context'
import {IModel, ValidationPhase} from '../../../lib'
import {ConstraintType, SortDirection} from '../../../lib'

export const postModel: IModel = modelContext
  .object()
  .children({
    id: modelContext.integerId(),
    userId: modelContext
      .integer()
      .constrain({type: ConstraintType.Reference})
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
