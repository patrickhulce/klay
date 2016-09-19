var Promise = require('bluebird');
var validateAndAutomanageFactory = require('klay-db/helpers').validateAndAutomanage;

var utils = require('../shared');

module.exports = function (modelDef, sequelizeModel, dependencies) {
  var validateAndAutomanage = validateAndAutomanageFactory(modelDef.model, 'create');
  var validateUnique = utils.validateUniqueConstraints(modelDef.model, sequelizeModel);
  var validateCustom = utils.validateCustomConstraints(modelDef.model, dependencies);

  var operation = {
    _insert: function (object, options) {
      return sequelizeModel.
        create(utils.toStorage(modelDef.model, object), options).
        then(record => utils.fromStorage(modelDef.model, record.get()));
    },
    run: function (object, options) {
      return Promise.resolve(object).
        then(object => validateAndAutomanage(object, {failLoudly: true}).value).
        then(object => validateUnique(object, null, options)).
        then(object => validateCustom(object, null, options)).
        then(object => operation._insert(object, options));
    },
  };

  return operation;
};
