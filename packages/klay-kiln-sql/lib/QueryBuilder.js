var _ = require('lodash');
var utils = require('./shared');

module.exports = function (klayModel, sequelizeModel, query) {
  query = query || {};

  var builder = {
    where: function (key, value) {
      var where = query.where = query.where || {};
      if (typeof key === 'object') {
        _.assign(where, key);
      } else if (typeof key === 'string' && typeof value !== 'undefined') {
        where[key] = value;
      }
      return builder;
    },
    limit: function (value) {
      if (typeof value !== 'undefined') { query.limit = Number(value); }
      return builder;
    },
    offset: function (value) {
      if (typeof value !== 'undefined') { query.offset = Number(value); }
      return builder;
    },
    orderBy: function (value) {
      if (typeof value !== 'undefined') { query.order = value; }
      return builder;
    },
    fields: function (value) {
      if (typeof value !== 'undefined') { query.attributes = value; }
      return builder;
    },
    toObject: function () {
      return _.cloneDeep(query);
    },
    fetchCount: function (options) {
      if (!sequelizeModel) { throw new Error('no model provided to QueryBuilder'); }
      return sequelizeModel.count(_.assign({}, query, options));
    },
    fetchResult: function (options) {
      if (!sequelizeModel) { throw new Error('no model provided to QueryBuilder'); }
      return sequelizeModel.findOne(_.assign({}, query, options)).then(function (item) {
        if (item) {
          return utils.fromStorage(klayModel, item.get());
        }
      });
    },
    fetchResults: function (options) {
      if (!sequelizeModel) { throw new Error('no model provided to QueryBuilder'); }
      return sequelizeModel.findAll(_.assign({}, query, options)).then(function (items) {
        return items.map(function (item) {
          return utils.fromStorage(klayModel, item.get());
        });
      });
    },
  };

  return builder;
};
