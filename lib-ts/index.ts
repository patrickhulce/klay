import {ModelContext} from './model-context'
import {IModelContext} from './typedefs'

export * from './typedefs'
export {assertions as assert} from './errors/validation-error'

const defaultModelContext = ModelContext.create()
export {ModelContext, defaultModelContext}
// tslint:disable-next-line
export default defaultModelContext
