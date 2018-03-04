const _ = require('lodash')
const klay = require('klay')

const validTypes = ['boolean', 'string', 'number', 'date']

function coerceToObjectIfNecessary(value) {
  if (typeof value === 'object' && value !== null) {
    return value
  } else if (typeof value !== 'undefined') {
    return {$eq: value}
  }
}

function generateModelsForProperty(name, model, options) {
  const modifiedModel = model.optional().default()
  const useEquality = options.equality === true || _.includes(options.equality, name)
  const useRange = options.range === true || _.includes(options.range, name)
  if (!_.includes(validTypes, model.spec.type) || (!useEquality && !useRange)) {
    return []
  }

  const children = []

  if (useEquality) {
    children.push('$eq', '$ne')
  }

  if (useRange && model.spec.type !== 'boolean') {
    children.push('$lt', '$lte', '$gt', '$gte')
  }

  const selectorsModel = klay.builders.object()
    .parse(coerceToObjectIfNecessary)
    .children(children.map(name => ({name, model: modifiedModel})))
    .optional().strict()

  return [{name, model: selectorsModel}]
}

function querifyModel(model, options) {
  options = _.assign({equality: true, range: false}, options)

  return klay.builders.object().children(_(model.spec.children)
    .map(child => generateModelsForProperty(child.name, child.model, options))
    .flatten()
    .value()
  )
}

module.exports = querifyModel
