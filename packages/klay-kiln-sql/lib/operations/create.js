const Promise = require('bluebird')
const validateAndAutomanageFactory = require('klay-db/helpers').validateAndAutomanage

const utils = require('../shared')

module.exports = function (modelDef, sequelizeModel, dependencies) {
  const validateAndAutomanage = validateAndAutomanageFactory(modelDef.model, 'create')
  const validateUnique = utils.validateUniqueConstraints(modelDef.model, dependencies)
  const validateCustom = utils.validateCustomConstraints(modelDef.model, dependencies)

  const operation = {
    _insert(object, options) {
      return sequelizeModel
        .create(utils.toStorage(modelDef.model, object), options)
        .then(record => utils.fromStorage(modelDef.model, record.get()))
    },
    run(object, options) {
      return Promise.resolve(object)
        .then(object => validateAndAutomanage(object, {failLoudly: true}).value)
        .then(object => validateUnique(object, null, options))
        .then(object => validateCustom(object, null, options))
        .then(object => operation._insert(object, options))
    },
  }

  return operation
}
