const ModelContext = require('../../lib-ts/model-context').ModelContext

module.exports = function() {
  const context = ModelContext.create()
  context.use({defaults: {required: true, strict: true}})

  const HtmlMetadata = context.object().children({
    title: context.string(),
    version: context.string(),
  })

  const JsonMetadata = context.object().children({
    type: context.string().enum(['object', 'array']),
    size: context.integer().strict(false),
  })

  const HtmlSource = context
    .object()
    .children({
      raw: context.string().min(8),
      text: context.string(),
    })

  const JsonSource = context
    .object()
    .strict(false)

  const appliesHtml = result => result.rootValue.type === 'html'
  const appliesJson = result => result.rootValue.type === 'json'
  const Document = context.object().children({
    id: context.uuid(),
    parentId: context.uuid(),
    type: context.string().enum(['html', 'json']),
    metadata: context.object().enum([
      {option: HtmlMetadata, applies: appliesHtml},
      {option: JsonMetadata, applies: appliesJson}
    ]),
    source: context.object().enum([
      {option: HtmlSource, applies: appliesHtml},
      {option: JsonSource, applies: appliesJson}
    ]),
    createdAt: context.date(),
    updatedAt: context.date(),
  })

  return Document
}
