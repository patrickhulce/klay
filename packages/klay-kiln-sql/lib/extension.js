var _ = require('lodash');
var Model = require('./Model');
var Sequelize = require('./sequelize/connection');

function determineDependency(modelDef, constraint) {
  if (constraint.type === 'reference') {
    return _.get(constraint, 'meta.model') + ':sql';
  } else if (constraint.type === 'custom') {
    return _.get(constraint, 'meta.dependencies', []).
      filter(dep => dep !== modelDef.name + ':sql');
  } else {
    return [];
  }
}

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
        map(constraint => determineDependency(modelDef, constraint)).
        flatten().
        uniq().
        value();
    },
    bake: function (modelDef, options, dependencies) {
      _.assign(options, {sequelize, dependencies});
      return new Model(modelDef, options);
    },
  };
};
