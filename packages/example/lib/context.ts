import {ModelContext, IModelContext} from 'klay-core'
import {DatabaseExtension} from 'klay-db'

export const modelContext: IModelContext = ModelContext.create()
  .use(new DatabaseExtension())
  .use({defaults: {strict: true, required: true}})
