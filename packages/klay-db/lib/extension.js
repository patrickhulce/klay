var _ = require('lodash');
var Options = require('./Options');
var gatherDbOptions = require('./helpers/gatherDbOptions');

module.exports = function (extOptions) {
  extOptions = _.assign({
    footprint: 'large',
  }, extOptions);

  var delegateToOptions = function (name, prefix) {
    return function () {
      var options = new Options(this.spec.db || {});
      var args = _.slice(arguments);
      if (typeof prefix === 'string') {
        args = [prefix].concat(args);
      }

      options = options[name].apply(options, args);
      return this.db(options);
    };
  };

  var medium = {
    dbindex: delegateToOptions('index', '__childplaceholder__'),
    dbconstrain: delegateToOptions('constrain', '__childplaceholder__'),
    dbautomanage: delegateToOptions('automanage', '__childplaceholder__'),
    dbindexChildren: delegateToOptions('index'),
    dbconstrainChildren: delegateToOptions('constrain'),
    dbautomanageChildren: delegateToOptions('automanage'),
  };

  var large = {
    primaryKey: function (meta) {
      return this.dbconstrain('primary', meta);
    },
    unique: function (meta) {
      return this.dbconstrain('unique', meta);
    },
    immutable: function (meta) {
      return this.dbconstrain('immutable', meta);
    },
    autoincrement: function () {
      return this.dbautomanage('create', 'insert', 'autoincrement');
    },
  };

  var extras = {};
  if (extOptions.footprint === 'large') {
    _.assign(extras, medium, large);
  } else if (extOptions.footprint === 'medium') {
    _.assign(extras, medium);
  }

  return function (construct) {
    return {
      builders: {
        createdAt: function (type) {
          return construct({type: 'date'}).
            dbautomanage('create', type || 'date').
            immutable();
        },
        updatedAt: function (type) {
          return construct({type: 'date'}).
            dbautomanage('*', type || 'date');
        },
        integerId: function () {
          return construct({type: 'number', format: 'integer'}).
            primaryKey().autoincrement();
        },
        uuidId: function () {
          return construct({type: 'string', format: 'uuid'}).
            dbautomanage('create', 'uuid').
            primaryKey();
        },
      },
      hooks: {
        children: function () {
          if (this.spec.type !== 'object') { return; }
          this.spec.db = gatherDbOptions(this.spec.db, this.spec.children).toObject();
        },
      },
      extend: _.assign({
        db: function (options) {
          options = new Options(options).toObject();
          return this._with({db: options});
        },
      }, extras),
    };
  };
};
