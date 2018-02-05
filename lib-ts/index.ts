import {ModelContext} from './model-context'

export * from './typedefs'

const defaultModelContext = new ModelContext()
export {ModelContext, defaultModelContext}
// tslint:disable-next-line
export default defaultModelContext
