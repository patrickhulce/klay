var _ = require('lodash');
var klay = require('klay');

var findDbModel = require('../shared/findDbModel');
var paramifyModel = require('../shared/paramifyModel');
var querifyModel = require('../shared/querifyModel');
var queryBuilderFactory = require('../shared/queryBuilder');

function generateModel(model, options) {
  var minLimit = _.get(options, 'minLimit', 0);
  var maxLimit = _.get(options, 'maxLimit', 1000);
  var defaultLimit = _.get(options, 'defaultLimit', 0);
  var limitModel = klay.builders.integer().
    min(minLimit).max(maxLimit).default(defaultLimit).
    optional();

  var querifiedModel = querifyModel(model, options);
  return querifiedModel.merge(klay.builders.object({limit: limitModel}));
}

function destroyOne(dbModel) {
  return function (req, res, next) {
    res.promise = dbModel.destroyOne(req.validated.params);
    next();
  };
}

function destroyAll(dbModel) {
  return function (req, res, next) {
    var query = _.size(req.query) > 0 ? req.validated.query : req.validated.body;
    var queryBuilder = queryBuilderFactory(dbModel, query);

    res.promise = queryBuilder.fetchCount().then(function (total) {
      var params = queryBuilder.toObject();
      var destroyWhere = params.where || {};
      var destroyOptions = params.limit === 0 ? {} : _.pick(params, ['limit']);

      return dbModel.destroy(destroyWhere, destroyOptions).then(function () {
        return {total};
      });
    });

    next();
  };
}

module.exports = {
  options: {byId: true},
  paramsModel: function (modelDef, options) {
    return options.byId ? paramifyModel(modelDef.model, modelDef.name).required() : null;
  },
  queryModel: function (modelDef, options) {
    return options.byId ? null : generateModel(modelDef.model, options).optional();
  },
  bodyModel: function (modelDef, options) {
    return options.byId ? null : generateModel(modelDef.model, options).optional();
  },
  handler: function (modelDef, options, extOptions, dependencies) {
    var dbModel = findDbModel(modelDef.name, options, dependencies);
    return options.byId ? destroyOne(dbModel, options) : destroyAll(dbModel, options);
  },
};
