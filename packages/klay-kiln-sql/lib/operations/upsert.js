var _ = require('lodash');
var utils = require('../shared');
var createOperation = require('./create');
var updateOperation = require('./update');

module.exports = function (modelDef, sequelizeModel) {
  var getPrimaryKey = utils.getPrimaryKey(modelDef.model);
  var findByPrimaryKey = utils.findByPrimaryKey(modelDef.model, sequelizeModel);
  var lookupRecords = utils.lookupByUniqueConstrains(modelDef.model, sequelizeModel);

  var create = createOperation(modelDef, sequelizeModel).run;
  var update = updateOperation(modelDef, sequelizeModel).run;

  var operation = {
    _lookupExistingRecord: function (object) {
      return lookupRecords(object).then(function (lookups) {
        if (!_.find(lookups, 'record')) {
          return;
        }

        var firstLookup = lookups[0];
        lookups.reduce(function (previous, current) {
          if (_.isEqual(previous.record, current.record)) {
            return current;
          } else {
            throw new Error('ambiguous upsert matches multiple records');
          }
        }, firstLookup);

        return findByPrimaryKey(firstLookup.record).then(function (existing) {
          return _.assign({}, existing, object);
        });
      });
    },
    run: function (object, options) {
      var validationResults = modelDef.model.validate(object);
      var primaryKey = getPrimaryKey(validationResults.value);

      if (primaryKey) {
        return update(object, options);
      } else {
        return operation._lookupExistingRecord(object).then(function (merged) {
          return merged ? update(merged, options) : create(object, options);
        });
      }
    },
  };

  return operation;
};
