const assert = require('assert')

const _ = require('lodash')
const sequelizeExtras = require('./extras')
const sequelizeDatatypes = require('./datatypes')

module.exports = {
  fromKlayModel(klayModelDef, options, dependencies) {
    const klayModel = klayModelDef.model
    const sequelize = options.sequelize

    const sequelizeObject = {}

    assert.equal(_.get(klayModel, 'spec.type'), 'object', 'klay model must be an object')
    const klayModelChildren = _.get(klayModel, 'spec.children', [])
    klayModelChildren.forEach(child => {
      sequelizeObject[child.name] = {
        type: sequelizeDatatypes.fromKlayModel(child.model),
      }
    })

    const sequelizeOptions = {
      timestamps: false,
      freezeTableName: true,
      indexes: sequelizeExtras.klayModelToIndexes(klayModel),
      tableName: _.get(klayModelDef, 'meta.plural', klayModelDef.name + 's'),
    }

    sequelizeExtras.associatePrimaryKey(klayModel, sequelizeObject)
    const sequelizeModel = sequelize.define(klayModelDef.name, sequelizeObject, sequelizeOptions)
    sequelizeExtras.associateForeignKeys(klayModel, sequelizeModel, dependencies)
    return sequelizeModel
  },
}
