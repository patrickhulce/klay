var Promise = require('bluebird');
var validateAndAutomanageFactory = require('klay-db/lib/helpers').validateAndAutomanage;

var utils = require('../shared');

module.exports = function (modelDef, sequelizeModel) {
  var validateAndAutomanage = validateAndAutomanageFactory(modelDef.model, 'create');
  var validateUnique = utils.validateUniqueConstraints(modelDef.model, sequelizeModel);

  var operation = {
    _insert: function (object) {
      return sequelizeModel.
        create(utils.toStorage(modelDef.model, object)).
        then(record => utils.fromStorage(modelDef.model, record.get()));
    },
    run: function (object, options) {
      return Promise.resolve(object).
        then(object => validateAndAutomanage(object, {failLoudly: true}).value).
        then(object => validateUnique(object, options)).
        then(object => operation._insert(object, options));
    },
  };

  return operation;
};
