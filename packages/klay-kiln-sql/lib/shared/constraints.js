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

function validateUniqueConstraints(model, sequelizeModel) {
  var attributes = [primaryKeyUtils.getPrimaryKeyField(model)];
  var getPrimaryKey = primaryKeyUtils.getPrimaryKey(model);
  var uniqueConstraints = getConstraints(model, 'unique');

  return function (object) {
    return Promise.map(uniqueConstraints, function (item) {
      var where = _(item.properties).
        map(prop => _.set({name: prop}, 'value', _.get(object, prop))).
        keyBy('name').
        mapValues('value').
        value();

      return sequelizeModel.findOne({where, attributes}).then(function (result) {
        return {
          name: item.name,
          exists: Boolean(result) && getPrimaryKey(result) !== getPrimaryKey(object),
        };
      });
    }).then(function (lookups) {
      lookups.forEach(function (lookup) {
        assert.ok(!lookup.exists, `constraint ${lookup.name} violated`);
      });

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
  validatePrimaryConstraint,
  validateUniqueConstraints,
  validateImmutableConstraints,
};
