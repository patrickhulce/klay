var _ = require('lodash');

var utils = require('../shared');

module.exports = {
  fromKlayModel: function (klayModel, sequelizeObject) {
    var indexes = _.get(klayModel, 'spec.db.indexes', []);
    var constraints = _.get(klayModel, 'spec.db.constraints', []);
    var automanaged = _.get(klayModel, 'spec.db.automanaged', []);

    // Setup the primaryKey
    var pkName = utils.getPrimaryKeyField(klayModel);
    sequelizeObject[pkName].primaryKey = true;

    // Add the query indexes
    var sequelizeIndexes = [];
    indexes.forEach(function (index) {
      sequelizeIndexes.push({
        method: 'BTREE',
        name: _.map(index, 'property').join('_'),
        fields: index.map(item => ({attribute: item.property, order: item.direction})),
      });
    });

    // Add the unique indexes
    _.filter(constraints, {type: 'unique'}).forEach(function (constraint) {
      sequelizeIndexes.push({unique: true, fields: constraint.properties});
    });

    // Add the autoincrement fields
    _.filter(automanaged, {supplyWith: 'autoincrement'}).forEach(function (item) {
      sequelizeObject[item.property].autoIncrement = true;
    });

    return sequelizeIndexes;
  },
};
