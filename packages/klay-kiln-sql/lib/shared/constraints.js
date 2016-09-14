var assert = require('assert');

var _ = require('lodash');
var Promise = require('bluebird');

var primaryKeyUtils = require('./primaryKey');

function getConstraints(model, type) {
  var constraints = _.get(model, 'spec.db.constraints', []);
  return type ? _.filter(constraints, {type}) : constraints;
}

function validatePrimaryConstraint(model, sequelizeModel) {
  var findByPrimaryKey = primaryKeyUtils.findByPrimaryKey(model, sequelizeModel);

  return function (object) {
    return findByPrimaryKey(object, {failLoudly: true});
  };
}

function lookupByUniqueConstrains(model, sequelizeModel) {
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

      return sequelizeModel.findOne({where, attributes}).then(function (record) {
        return onEach({constraint, record: record && record.get()});
      });
    });
  };
}

function validateUniqueConstraints(model, sequelizeModel) {
  var getPrimaryKey = primaryKeyUtils.getPrimaryKey(model);
  var lookupRecords = lookupByUniqueConstrains(model, sequelizeModel);

  return function (object) {
    return lookupRecords(object, function (lookup) {
      var passes = !lookup.record || getPrimaryKey(lookup.record) === getPrimaryKey(object);
      assert.ok(passes, `constraint ${lookup.constraint.name} violated`);
    }).then(function () {
      return object;
    });
  };
}

function validateImmutableConstraints(model, sequelizeModel) {
  var immutableConstraints = getConstraints(model, 'immutable');
  var findByPrimaryKey = primaryKeyUtils.findByPrimaryKey(model, sequelizeModel);

  function assertEquality(object, record) {
    immutableConstraints.forEach(function (constraint) {
      var existing = constraint.properties.map(prop => _.get(record, prop));
      var incoming = constraint.properties.map(prop => _.get(object, prop));
      assert.ok(_.isEqual(existing, incoming), `constraint ${constraint.name} violated`);
    });
  }

  return function (object, record, options) {
    if (record) {
      return findByPrimaryKey(object, options).then(function (record) {
        assertEquality(object, record);
        return object;
      });
    } else {
      assertEquality(object, record);
      return object;
    }
  };
}

module.exports = {
  getConstraints,
  lookupByUniqueConstrains,
  validatePrimaryConstraint,
  validateUniqueConstraints,
  validateImmutableConstraints,
};
