/* eslint-disable no-use-extend-native/no-use-extend-native */
const assert = require('assert')

const _ = require('lodash')
const Promise = require('bluebird')

const primaryKeyUtils = require('./primaryKey')

function getConstraints(model, type) {
  const constraints = _.get(model, 'spec.db.constraints', [])
  return type ? _.filter(constraints, {type}) : constraints
}

function validatePrimaryConstraint(model, dependencies) {
  return function (object) {
    return dependencies.__self.findById(object, {failLoudly: true})
  }
}

function lookupByUniqueConstrains(model, dependencies) {
  const findOne = q => dependencies.__self.findOne(q)
  const attributes = [primaryKeyUtils.getPrimaryKeyField(model)]
  const uniqueConstraints = getConstraints(model, 'unique')

  return function (object, onEach) {
    onEach = onEach || _.identity

    return Promise.map(uniqueConstraints, constraint => {
      const where = _(constraint.properties)
        .map(prop => _.set({name: prop}, 'value', _.get(object, prop)))
        .keyBy('name')
        .mapValues('value')
        .value()

      return findOne({where, attributes}).then(record => {
        return onEach({constraint, record})
      })
    })
  }
}

function validateUniqueConstraints(model, dependencies) {
  const getPrimaryKey = primaryKeyUtils.getPrimaryKey(model)
  const lookupRecords = lookupByUniqueConstrains(model, dependencies)

  return function (object) {
    return lookupRecords(object, lookup => {
      const passes = !lookup.record || getPrimaryKey(lookup.record) === getPrimaryKey(object)
      assert.ok(passes, `constraint ${lookup.constraint.name} violated`)
    }).then(() => {
      return object
    })
  }
}

function validateImmutableConstraints(model, dependencies) {
  const findById = (obj, opts) => dependencies.__self.findById(obj, opts)
  const immutableConstraints = getConstraints(model, 'immutable')

  function assertEquality(object, record) {
    immutableConstraints.forEach(constraint => {
      const existing = constraint.properties.map(prop => _.get(record, prop))
      const incoming = constraint.properties.map(prop => _.get(object, prop))
      assert.ok(_.isEqual(existing, incoming), `constraint ${constraint.name} violated`)
    })
  }

  return function (object, record, options) {
    if (record) {
      assertEquality(object, record)
      return object
    } else {
      return findById(object, options).then(record => {
        assertEquality(object, record)
        return object
      })
    }
  }
}

function validateCustomConstraints(model, dependencies) {
  const customConstraints = getConstraints(model, 'custom')

  return function (object, record, options) {
    return Promise.map(customConstraints, constraint => {
      const assert = constraint.meta.assert || _.noop
      const queryBuilder = dependencies.__self.queryBuilder()
      return assert.call(queryBuilder, object, record, constraint, dependencies, options)
    }, {concurrency: _.get(options, 'concurrency', 1)}).then(() => {
      return object
    })
  }
}

module.exports = {
  getConstraints,
  lookupByUniqueConstrains,
  validatePrimaryConstraint,
  validateUniqueConstraints,
  validateImmutableConstraints,
  validateCustomConstraints,
}
