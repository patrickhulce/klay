var assert = require('assert');
var _ = require('lodash');
var Promise = require('bluebird');
var validateAndAutomanageFactory = require('klay-db/helpers').validateAndAutomanage;

var utils = require('../shared');
var updateOperation = require('./update');

module.exports = function (modelDef, sequelizeModel, dependencies) {
  var findByPrimaryKey = utils.findByPrimaryKey(modelDef.model, dependencies);
  var validateAndAutomanage = validateAndAutomanageFactory(modelDef.model, 'update');

  var update = updateOperation(modelDef, sequelizeModel, dependencies).run;

  var operation = {
    _mergeObject: function (patch, record) {
      assert.equal(typeof patch, 'object', 'patch must be an object');
      var merged = _.cloneDeep(record);
      _.forEach(patch, (v, k) => _.set(merged, k, v));
      return merged;
    },
    _update: function (patch, record, options) {
      var merged = operation._mergeObject(patch, record);
      return update(merged, options);
    },
    run: function (patch, options) {
      return Promise.resolve(patch).
        then(object => validateAndAutomanage(object).value).
        then(object => findByPrimaryKey(object, options)).
        then(record => operation._update(patch, record, options));
    },
  };

  return operation;
};
