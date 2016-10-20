var _ = require('lodash');
var klay = require('klay');
var Promise = require('bluebird');
var querifyModel = require('../shared/querifyModel');
var findDbModel = require('../shared/findDbModel');
var queryBuilderFactory = require('../shared/queryBuilder');

function parseOrder(value) {
  return typeof value === 'string' ? value.split(' ') : value;
}

function generateAdditionalFields(model, options) {
  var maxLimit = _.get(options, 'maxLimit', 1000);
  var defaultLimit = _.get(options, 'defaultLimit', 10);
  var defaultOrder = _.get(options, 'defaultOrder', [['updatedAt', 'desc']]);

  var offsetModel = klay.builders.integer().min(0).default(0).optional();
  var limitModel = klay.builders.integer().min(0).max(maxLimit).default(defaultLimit).optional();

  var fieldModel = klay.builders.enum(model.spec.children.map(child => child.name));
  var fieldsModel = klay.builders.array(fieldModel).optional();

  var orderItemModel = klay.builders.conditional().
    option(fieldModel, (value, unused, path) => {
      return path.split('.')[2] === '0';
    }).
    option(klay.builders.enum('asc', 'desc'), (value, unused, path) => {
      return path.split('.')[2] === '1';
    });

  var orderEntryModel = klay.builders.array(orderItemModel).parse(parseOrder).length(2);
  var orderByModel = klay.builders.array(orderEntryModel).default(defaultOrder).optional();

  return [
    {name: 'offset', model: offsetModel},
    {name: 'limit', model: limitModel},
    {name: 'orderBy', model: orderByModel},
    {name: 'fields', model: fieldsModel},
  ];
}

function generateModel(model, options) {
  var querified = querifyModel(model, options);
  var additional = generateAdditionalFields(model, options);

  return klay.builders.object(additional.concat(querified.spec.children));
}

module.exports = {
  options: {
    queryIn: 'query',
  },
  queryModel: function (modelDef, options) {
    return options.queryIn === 'query' ?
      generateModel(modelDef.model, options) : null;
  },
  bodyModel: function (modelDef, options) {
    return options.queryIn === 'body' ?
      generateModel(modelDef.model, options) : null;
  },
  handler: function (modelDef, options, extOptions, dependencies) {
    var dbModel = findDbModel(modelDef.name, options, dependencies);

    return function (req, res, next) {
      var query = req.validated[options.queryIn];
      var queryBuilder = queryBuilderFactory(dbModel, query);

      res.promise = Promise.all([
        queryBuilder.fetchResults(),
        queryBuilder.fetchCount(),
      ]).spread(function (data, total) {
        return _.assign({data, total}, _.pick(query, ['limit', 'offset']));
      });

      next();
    };
  },
};
