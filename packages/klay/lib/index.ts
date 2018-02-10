import {ModelContext} from './model-context'
import {IModelContext} from './typedefs'

export * from './typedefs'
export {assertions as assert, ValidationError} from './errors/validation-error'
export {assertions as modelAssertions, ModelError} from './errors/model-error'

const defaultModelContext = ModelContext.create()
export {ModelContext, defaultModelContext}
// tslint:disable-next-line
export default defaultModelContext
