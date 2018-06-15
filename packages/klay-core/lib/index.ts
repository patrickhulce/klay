import {ModelContext} from './model-context'
import {IModelContext} from './typedefs' // tslint:disable-line

export * from './typedefs'
export {Assertions} from './errors/assertions'
export {assert, AssertionError} from './errors/assertion-error'
export {modelAssertions, ModelError} from './errors/model-error'

const defaultModelContext = ModelContext.create()
export {ModelContext, defaultModelContext}
// tslint:disable-next-line
export default defaultModelContext
