const _ = require('lodash')

function creatifyModel(model) {
  const automanaged = _.get(model, 'spec.db.automanaged', [])
  const automanagedNames = _.map(automanaged, 'property')
  return model.omit(automanagedNames).strict().required()
}

module.exports = creatifyModel
