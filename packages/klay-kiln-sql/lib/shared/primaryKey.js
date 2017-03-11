const assert = require('assert')
const _ = require('lodash')

const PK_MULTI_MSG = 'multi-column primary key not yet supported'
const PK_NOT_FOUND_MSG = 'could not find primary key field for model'

function getPrimaryKeyField(model) {
  const children = _.get(model, 'spec.children', [])
  const constraints = _.get(model, 'spec.db.constraints', [])

  const primaryConstraint = _.find(constraints, {type: 'primary'})
  if (primaryConstraint) {
    assert.equal(primaryConstraint.properties.length, 1, PK_MULTI_MSG)
    return _.get(primaryConstraint, 'properties.0')
  } else if (_.find(children, {name: 'id'})) {
    return 'id'
  } else {
    throw new Error(PK_NOT_FOUND_MSG)
  }
}

function getPrimaryKey(model) {
  const field = getPrimaryKeyField(model)
  return item => _.get(item, field)
}

function setPrimaryKey(model) {
  const field = getPrimaryKeyField(model)
  return (obj, pk) => _.set(obj, field, pk)
}

function findByPrimaryKey(model, dependencies) {
  const get = getPrimaryKey(model)
  const set = setPrimaryKey(model)
  return function (object, options) {
    const pk = typeof object === 'object' ? get(object) : object
    const where = set({}, pk)
    return dependencies.__self.findOne({where}).then(record => {
      if (options && options.failLoudly) {
        assert.ok(record, `no such object with primaryKey: ${pk}`)
      }

      return record
    })
  }
}

module.exports = {getPrimaryKey, setPrimaryKey, findByPrimaryKey, getPrimaryKeyField}
