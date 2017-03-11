const assert = require('assert')
const _ = require('lodash')
const Promise = require('bluebird')
const validateAndAutomanageFactory = require('klay-db/helpers').validateAndAutomanage

const utils = require('../shared')
const updateOperation = require('./update')

module.exports = function (modelDef, sequelizeModel, dependencies) {
  const findByPrimaryKey = utils.findByPrimaryKey(modelDef.model, dependencies)
  const validateAndAutomanage = validateAndAutomanageFactory(modelDef.model, 'update')

  const update = updateOperation(modelDef, sequelizeModel, dependencies).run

  const operation = {
    _mergeObject(patch, record) {
      assert.equal(typeof patch, 'object', 'patch must be an object')
      const merged = _.cloneDeep(record)
      _.forEach(patch, (v, k) => _.set(merged, k, v))
      return merged
    },
    _update(patch, record, options) {
      const merged = operation._mergeObject(patch, record)
      return update(merged, options)
    },
    run(patch, options) {
      return Promise.resolve(patch)
        .then(object => validateAndAutomanage(object).value)
        .then(object => findByPrimaryKey(object, options))
        .then(record => operation._update(patch, record, options))
    },
  }

  return operation
}
