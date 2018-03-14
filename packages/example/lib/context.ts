import {ModelContext, IModelContext} from 'klay'
import {Extension as DatabaseExtension} from 'klay-db'

export const modelContext: IModelContext = ModelContext.create()
  .use(new DatabaseExtension())
  .use({defaults: {strict: true, required: true}})
