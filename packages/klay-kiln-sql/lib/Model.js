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
  var findByPrimaryKey = utils.findByPrimaryKey(modelDef.model, sequelizeModel);

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
    queryBuilder: function (query) {
      return new QueryBuilder(sequelizeModel, query);
    },
  };

  return dbModel;
};
