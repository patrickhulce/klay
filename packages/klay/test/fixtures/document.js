module.exports = function (klay) {
  klay.use({defaults: {required: true, strict: true}});
  var types = klay.builders;

  var HtmlMetadata = types.object({
    title: types.string(),
    version: types.string(),
  });

  var JsonMetadata = types.object({
    type: types.enum(['object', 'array']),
    size: types.integer(),
  });

  var HtmlSource = types.object({
    raw: types.string().min(8),
    text: types.string(),
  });

  var JsonSource = types.object().strict(false);

  var Document = {
    id: types.uuid(),
    parentId: types.uuid(),
    type: types.enum(['html', 'json']),
    metadata: types.conditional().
      option(HtmlMetadata, 'type', 'html').
      option(JsonMetadata, 'type', 'json'),
    source: types.conditional().
      option(HtmlSource, 'type', 'html').
      option(JsonSource, 'type', 'json'),
    createdAt: types.date(),
    updatedAt: types.date(),
  };

  return types.object(Document);
};
