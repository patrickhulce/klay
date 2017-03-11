const _ = require('lodash')
const Model = require('./Model')
const Sequelize = require('./sequelize/connection')

function determineDependency(modelDef, constraint) {
  if (constraint.type === 'reference') {
    return _.get(constraint, 'meta.model') + ':sql'
  } else if (constraint.type === 'custom') {
    return _.get(constraint, 'meta.dependencies', [])
      .filter(dep => dep !== modelDef.name + ':sql')
  } else {
    return []
  }
}

module.exports = function (dbOptions) {
  const sequelize = new Sequelize(dbOptions)

  return {
    _sequelize: sequelize,
    name: 'sql',
    sync(options) {
      return sequelize.sync(options)
    },
    determineDependencies(modelDef) {
      const constraints = _.get(modelDef, 'model.spec.db.constraints', [])
      return _(constraints)
        .map(constraint => determineDependency(modelDef, constraint))
        .flatten()
        .uniq()
        .value()
    },
    bake(modelDef, options, dependencies) {
      _.assign(options, {sequelize, dependencies})
      return new Model(modelDef, options)
    },
  }
}
