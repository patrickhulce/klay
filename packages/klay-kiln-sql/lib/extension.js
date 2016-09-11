var _ = require('lodash');
var Model = require('./Model');
var Sequelize = require('./sequelize/connection');

module.exports = function (dbOptions, migrationOptions) {
  var sequelize = new Sequelize(dbOptions);

  return {
    _sequelize: sequelize,
    name: 'sql',
    sync: function (options) {
      return sequelize.sync(options);
    },
    determineDependencies: function (modelDef, options) {
      var constraints = _.get(modelDef, 'model.spec.db.constraints', []);
      return _(constraints).
        filter({type: 'reference'}).
        map(item => _.get(item, 'meta.model') + ':sql').
        uniq().
        value();
    },
    bake: function (modelDef, options, dependencies) {
      _.assign(options, {sequelize, dependencies});
      return new Model(modelDef, options);
    },
  };
};
