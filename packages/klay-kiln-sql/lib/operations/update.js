var Promise = require('bluebird');
var validateAndAutomanageFactory = require('klay-db/lib/helpers').validateAndAutomanage;

var utils = require('../shared');

module.exports = function (modelDef, sequelizeModel) {
  var findByPrimaryKey = utils.findByPrimaryKey(modelDef.model, sequelizeModel);
  var validateAndAutomanage = validateAndAutomanageFactory(modelDef.model, 'update');
  var validatePrimary = utils.validatePrimaryConstraint(modelDef.model, sequelizeModel);
  var validateImmutable = utils.validateImmutableConstraints(modelDef.model, sequelizeModel);
  var validateUnique = utils.validateUniqueConstraints(modelDef.model, sequelizeModel);

  var operation = {
    _validateConstraints: function (object) {
      return Promise.resolve().
        then(() => validatePrimary(object)).
        then(record => validateImmutable(object, record)).
        then(() => validateUnique(object));
    },
    _update: function (object, options) {
      return sequelizeModel.
        build(utils.toStorage(modelDef.model, object), {isNewRecord: false}).
        save().
        then(() => findByPrimaryKey(object, options));
    },
    run: function (object, options) {
      return Promise.resolve(object).
        then(object => validateAndAutomanage(object, {failLoudly: true}).value).
        then(object => operation._validateConstraints(object, options)).
        then(object => operation._update(object, options));
    },
  };

  return operation;
};
