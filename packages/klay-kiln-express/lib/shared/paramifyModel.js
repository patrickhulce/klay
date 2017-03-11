const assert = require('assert')
const _ = require('lodash')

function paramifyModel(model, name) {
  const constraints = _.get(model, 'spec.db.constraints', [])
  const primary = _.find(constraints, {type: 'primary'})
  const primaryKey = _.get(primary, 'properties.0')
  const children = _.get(model, 'spec.children', [])
  const primaryKeyModel = _.find(children, {name: primaryKey})
  assert.ok(primaryKeyModel, `could not find primary key for ${name}`)
  return model.pick([primaryKey])
}

module.exports = paramifyModel
