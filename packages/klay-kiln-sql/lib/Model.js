var assert = require('assert');

var _ = require('lodash');
var Promise = require('bluebird');
var QueryBuilder = require('./QueryBuilder');
var sequelizeModels = require('./sequelize/models');
var operations = require('./operations');
var utils = require('./shared');

function asOneOrList(operation, startTransaction) {
  return function (object, options) {
    if (_.isArray(object)) {
      return startTransaction(function (transaction) {
        var opts = _.assign({}, options, {transaction});
        return Promise.mapSeries(object, item => operation(item, opts));
      });
    } else {
      return operation(object, options);
    }
  };
}

module.exports = function (modelDef, options) {
  var sequelize = options.sequelize;
  var dependencies = options.dependencies || {};
  var sequelizeModel = sequelizeModels.fromKlayModel(modelDef, options, dependencies);

  var transaction = sequelize.transaction.bind(sequelize);
  var create = operations.create(modelDef, sequelizeModel, dependencies).run;
  var update = operations.update(modelDef, sequelizeModel, dependencies).run;
  var upsert = operations.upsert(modelDef, sequelizeModel, dependencies).run;
  var patch = operations.patch(modelDef, sequelizeModel, dependencies).run;
  var setPrimaryKey = utils.setPrimaryKey(modelDef.model);
  var findByPrimaryKey = utils.findByPrimaryKey(modelDef.model, dependencies);

  if (_.get(options, 'createAsList', true)) {
    create = asOneOrList(create, transaction);
  }

  if (_.get(options, 'updateAsList', true)) {
    update = asOneOrList(update, transaction);
  }

  if (_.get(options, 'upsertAsList', true)) {
    upsert = asOneOrList(upsert, transaction);
  }

  var dbModel = {
    _sequelize: sequelize,
    _sequelizeModel: sequelizeModel,
    findById: findByPrimaryKey,
    transaction, create, update, upsert, patch,
    find: function (query, options) {
      return dbModel.queryBuilder(query).fetchResults(options);
    },
    findOne: function (query, options) {
      return dbModel.queryBuilder(query).fetchResult(options);
    },
    count: function (query, options) {
      return dbModel.queryBuilder(query).fetchCount(options);
    },
    patchById: function (id, changes, options) {
      var changesObj = _.assign({}, changes, setPrimaryKey({}, id));
      return patch(changesObj, options);
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
      return new QueryBuilder(modelDef.model, sequelizeModel, query);
    },
  };

  dependencies.__self = dependencies[modelDef.name + ':sql'] = dbModel;
  return dbModel;
};
