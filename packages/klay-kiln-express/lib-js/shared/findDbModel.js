const _ = require('lodash')

module.exports = function (modelName, options, dependencies) {
  const allowedModels = [`${modelName}:sql`, `${modelName}:mongo`]
  return _.find(dependencies, (value, name) => _.includes(allowedModels, name))
}
