import {modelContext} from '../model-context'
import {createHmac} from 'crypto'
import {IModel, ValidationPhase} from '../../../lib'
import {ConstraintType, SortDirection} from '../../../lib'

const SALT = 'super-secret-salt'

export const userModel: IModel = modelContext
  .object()
  .children({
    id: modelContext.integerID(),
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
