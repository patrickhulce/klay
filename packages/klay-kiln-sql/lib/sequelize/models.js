var assert = require('assert');

var _ = require('lodash');
var sequelizeIndexes = require('./indexes');
var sequelizeDatatypes = require('./datatypes');

module.exports = {
  fromKlayModel: function (klayModelDef, options) {
    var klayModel = klayModelDef.model;
    var sequelize = options.sequelize;

    var sequelizeObject = {};

    assert.equal(_.get(klayModel, 'spec.type'), 'object', 'klay model must be an object');
    var klayModelChildren = _.get(klayModel, 'spec.children', []);
    klayModelChildren.forEach(function (child) {
      sequelizeObject[child.name] = {type: sequelizeDatatypes.fromKlayModel(child.model)};
    });

    var sequelizeOptions = {
      timestamps: false,
      freezeTableName: true,
      indexes: sequelizeIndexes.fromKlayModel(klayModel, sequelizeObject),
      tableName: _.get(klayModelDef, 'meta.plural', klayModelDef.name + 's')
    };

    return sequelize.define(klayModelDef.name, sequelizeObject, sequelizeOptions);
  },
};
