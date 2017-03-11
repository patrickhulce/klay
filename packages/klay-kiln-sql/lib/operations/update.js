const Promise = require('bluebird')
const validateAndAutomanageFactory = require('klay-db/helpers').validateAndAutomanage

const utils = require('../shared')

module.exports = function (modelDef, sequelizeModel, dependencies) {
  const validateAndAutomanage = validateAndAutomanageFactory(modelDef.model, 'update')
  const validatePrimary = utils.validatePrimaryConstraint(modelDef.model, dependencies)
  const validateImmutable = utils.validateImmutableConstraints(modelDef.model, dependencies)
  const validateUnique = utils.validateUniqueConstraints(modelDef.model, dependencies)
  const validateCustom = utils.validateCustomConstraints(modelDef.model, dependencies)

  const operation = {
    _validateConstraints(object) {
      return validatePrimary(object).then(record => {
        return Promise.resolve()
          .then(() => validateImmutable(object, record))
          .then(() => validateUnique(object, record))
          .then(() => validateCustom(object, record))
      })
    },
    _update(object, options) {
      return sequelizeModel
        .build(utils.toStorage(modelDef.model, object), {isNewRecord: false})
        .save(options)
        .then(() => object)
    },
    run(object, options) {
      return Promise.resolve(object)
        .then(object => validateAndAutomanage(object, {failLoudly: true}).value)
        .then(object => operation._validateConstraints(object, options))
        .then(object => operation._update(object, options))
    },
  }

  return operation
}
