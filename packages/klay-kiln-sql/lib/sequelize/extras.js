const assert = require('assert')
const _ = require('lodash')

const utils = require('../shared')

module.exports = {
  klayModelToIndexes(klayModel) {
    const indexes = _.get(klayModel, 'spec.db.indexes', [])
    const constraints = _.get(klayModel, 'spec.db.constraints', [])

    // Add the query indexes
    const sequelizeIndexes = []
    indexes.forEach(index => {
      sequelizeIndexes.push({
        method: 'BTREE',
        name: _.map(index, 'property').join('_'),
        fields: index.map(item => ({attribute: item.property, order: item.direction})),
      })
    })

    // Add the unique indexes
    _.filter(constraints, {type: 'unique'}).forEach(constraint => {
      sequelizeIndexes.push({unique: true, fields: constraint.properties})
    })

    return sequelizeIndexes
  },
  associatePrimaryKey(klayModel, sequelizeObject) {
    const automanaged = _.get(klayModel, 'spec.db.automanaged', [])

    // Setup the primaryKey
    const pkName = utils.getPrimaryKeyField(klayModel)
    sequelizeObject[pkName].primaryKey = true
    sequelizeObject[pkName].nullable = false

    // Add the autoincrement fields
    _.filter(automanaged, {supplyWith: 'autoincrement'}).forEach(item => {
      sequelizeObject[item.property].autoIncrement = true
    })
  },
  associateForeignKeys(klayModel, sequelizeModel, dependencies) {
    const constraints = _.get(klayModel, 'spec.db.constraints', [])

    // Add the foreign key relationships
    _.filter(constraints, {type: 'reference'}).forEach(constraint => {
      const foreignKey = _.get(constraint, 'properties.0')
      assert.equal(constraint.properties.length, 1, 'multi-key foreign keys not yet supported')

      const modelName = _.get(constraint, 'meta.model', foreignKey.replace(/(_)?id$/ig, ''))
      const otherModel = _.get(dependencies, [modelName + ':sql', '_sequelizeModel'])
      sequelizeModel.belongsTo(otherModel, {foreignKey, onDelete: 'CASCADE'})
    })
  },
}
