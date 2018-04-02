const ModelContext = require('../../lib/model-context').ModelContext

const context = ModelContext.create()
context.use({defaults: {required: true, strict: true}})

const HtmlMetadata = context
  .object()
  .children({
    title: context.string(),
    version: context.string(),
  })
  .applies(result => result.rootValue.type === 'html')

const JsonMetadata = context
  .object()
  .children({
    type: context.string().enum(['object', 'array']),
    size: context.integer().strict(false),
  })
  .applies(result => result.rootValue.type === 'json')

const HtmlSource = context
  .object()
  .children({
    raw: context.string().min(8),
    text: context.string(),
  })
  .applies(result => result.rootValue.type === 'html')

const JsonSource = context
  .object()
  .strict(false)
  .applies(result => result.rootValue.type === 'json')

const Document = context.object().children({
  id: context.uuid(),
  parentId: context.uuid(),
  type: context.string().enum(['html', 'json']),
  metadata: context.object().enum([HtmlMetadata, JsonMetadata]),
  source: context.object().enum([HtmlSource, JsonSource]),
  createdAt: context.dateTime(),
  updatedAt: context.dateTime(),
})

module.exports = Document
