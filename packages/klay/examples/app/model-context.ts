import {ModelContext, IModelContext} from '../../lib'
import {DatabaseExtension} from '../../lib'
import {ExpressExtension} from '../../lib'

export const modelContext: IModelContext = ModelContext.create()
  .use(new DatabaseExtension())
  .use(new ExpressExtension())
  .use({defaults: {strict: true, required: true}})
