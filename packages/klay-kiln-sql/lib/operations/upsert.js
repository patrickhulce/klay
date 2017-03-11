const _ = require('lodash')
const utils = require('../shared')
const createOperation = require('./create')
const updateOperation = require('./update')

module.exports = function (modelDef, sequelizeModel, dependencies) {
  const getPrimaryKey = utils.getPrimaryKey(modelDef.model)
  const findByPrimaryKey = utils.findByPrimaryKey(modelDef.model, dependencies)
  const lookupRecords = utils.lookupByUniqueConstrains(modelDef.model, dependencies)

  const create = createOperation(modelDef, sequelizeModel, dependencies).run
  const update = updateOperation(modelDef, sequelizeModel, dependencies).run

  const operation = {
    _lookupExistingRecord(object) {
      return lookupRecords(object).then(lookups => {
        if (!_.find(lookups, 'record')) {
          return
        }

        const firstLookup = lookups[0]
        lookups.reduce((previous, current) => {
          if (_.isEqual(previous.record, current.record)) {
            return current
          } else {
            throw new Error('ambiguous upsert matches multiple records')
          }
        }, firstLookup)

        return findByPrimaryKey(firstLookup.record).then(existing => {
          return _.assign({}, existing, object)
        })
      })
    },
    run(object, options) {
      const validationResults = modelDef.model.validate(object)
      const primaryKey = getPrimaryKey(validationResults.value)

      if (primaryKey) {
        return update(object, options)
      } else {
        return operation._lookupExistingRecord(object).then(merged => {
          return merged ? update(merged, options) : create(object, options)
        })
      }
    },
  }

  return operation
}
