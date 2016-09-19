var assert = require('assert');

var _ = require('lodash');
var Promise = require('bluebird');

var primaryKeyUtils = require('./primaryKey');

function getConstraints(model, type) {
  var constraints = _.get(model, 'spec.db.constraints', []);
  return type ? _.filter(constraints, {type}) : constraints;
}

function validatePrimaryConstraint(model, dependencies) {
  return function (object) {
    return dependencies.__self.findById(object, {failLoudly: true});
  };
}

function lookupByUniqueConstrains(model, dependencies) {
  var findOne = q => dependencies.__self.findOne(q);
  var attributes = [primaryKeyUtils.getPrimaryKeyField(model)];
  var uniqueConstraints = getConstraints(model, 'unique');

  return function (object, onEach) {
    onEach = onEach || _.identity;

    return Promise.map(uniqueConstraints, function (constraint) {
      var where = _(constraint.properties).
        map(prop => _.set({name: prop}, 'value', _.get(object, prop))).
        keyBy('name').
        mapValues('value').
        value();

      return findOne({where, attributes}).then(function (record) {
        return onEach({constraint, record});
      });
    });
  };
}

function validateUniqueConstraints(model, dependencies) {
  var getPrimaryKey = primaryKeyUtils.getPrimaryKey(model);
  var lookupRecords = lookupByUniqueConstrains(model, dependencies);

  return function (object) {
    return lookupRecords(object, function (lookup) {
      var passes = !lookup.record || getPrimaryKey(lookup.record) === getPrimaryKey(object);
      assert.ok(passes, `constraint ${lookup.constraint.name} violated`);
    }).then(function () {
      return object;
    });
  };
}

function validateImmutableConstraints(model, dependencies) {
  var findById = (obj, opts) => dependencies.__self.findById(obj, opts);
  var immutableConstraints = getConstraints(model, 'immutable');

  function assertEquality(object, record) {
    immutableConstraints.forEach(function (constraint) {
      var existing = constraint.properties.map(prop => _.get(record, prop));
      var incoming = constraint.properties.map(prop => _.get(object, prop));
      assert.ok(_.isEqual(existing, incoming), `constraint ${constraint.name} violated`);
    });
  }

  return function (object, record, options) {
    if (record) {
      assertEquality(object, record);
      return object;
    } else {
      return findById(object, options).then(function (record) {
        assertEquality(object, record);
        return object;
      });
    }
  };
}

function validateCustomConstraints(model, dependencies) {
  var customConstraints = getConstraints(model, 'custom');

  return function (object, record, options) {
    return Promise.map(customConstraints, function (constraint) {
      var assert = constraint.meta.assert || _.noop;
      var queryBuilder = dependencies.__self.queryBuilder();
      return assert.call(queryBuilder, object, record, constraint, dependencies, options);
    }, {concurrency: _.get(options, 'concurrency', 1)}).then(function () {
      return object;
    });
  };
}

module.exports = {
  getConstraints,
  lookupByUniqueConstrains,
  validatePrimaryConstraint,
  validateUniqueConstraints,
  validateImmutableConstraints,
  validateCustomConstraints,
};
