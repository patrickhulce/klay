var assert = require('assert');

var _ = require('lodash');
var QueryBuilder = require('./QueryBuilder');
var sequelizeModels = require('./sequelize/models');
var operations = require('./operations');
var utils = require('./shared');

module.exports = function (modelDef, options) {
  var sequelize = options.sequelize;
  var sequelizeModel = sequelizeModels.fromKlayModel(modelDef, options);

  var create = operations.create(modelDef, sequelizeModel).run;
  var update = operations.update(modelDef, sequelizeModel).run;
  var setPrimaryKey = utils.setPrimaryKey(modelDef.model);
  var findByPrimaryKey = utils.findByPrimaryKey(modelDef.model, sequelizeModel);
  var deserialize = record => utils.fromStorage(modelDef.model, record);

  var dbModel = {
    _sequelize: sequelize,
    _sequelizeModel: sequelizeModel,
    findById: findByPrimaryKey,
    create, update,
    find: function (query, options) {
      return dbModel.queryBuilder(query).fetchResults(options);
    },
    findOne: function (query, options) {
      return dbModel.queryBuilder(query).fetchResult(options);
    },
    count: function (query, options) {
      return dbModel.queryBuilder(query).fetchCount(options);
    },
    destroy: function (where, options) {
      return sequelizeModel.destroy(_.assign({where}, options));
    },
    destroyOne: function (where, options) {
      return sequelizeModel.destroy(_.assign({where, limit: 1}, options));
    },
    destroyById: function (id, options) {
      return dbModel.destroyOne(setPrimaryKey({}, id), options);
    },
    queryBuilder: function (query) {
      return new QueryBuilder(sequelizeModel, query, deserialize);
    },
  };

  return dbModel;
};
