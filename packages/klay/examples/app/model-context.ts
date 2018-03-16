import {ModelContext, IModelContext} from '../../lib'
import {DatabaseExtension} from '../../lib'

export const modelContext: IModelContext = ModelContext.create()
  .use(new DatabaseExtension())
  .use({defaults: {strict: true, required: true}})
