var _ = require('lodash');

module.exports = function (model, query) {
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
      if (!model) { throw new Error('no model provided to QueryBuilder'); }
      return model.count(_.assign({}, query, options));
    },
    fetchResult: function (options) {
      if (!model) { throw new Error('no model provided to QueryBuilder'); }
      return model.findOne(_.assign({}, query, options)).then(function (item) {
        return item.get();
      });
    },
    fetchResults: function (options) {
      if (!model) { throw new Error('no model provided to QueryBuilder'); }
      return model.findAll(_.assign({}, query, options)).then(function (items) {
        return items.map(function (item) { return item.get(); });
      });
    },
  };

  return builder;
};
