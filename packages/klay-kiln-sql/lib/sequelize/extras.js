var assert = require('assert');
var _ = require('lodash');

var utils = require('../shared');

module.exports = {
  klayModelToIndexes: function (klayModel) {
    var indexes = _.get(klayModel, 'spec.db.indexes', []);
    var constraints = _.get(klayModel, 'spec.db.constraints', []);

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

    return sequelizeIndexes;
  },
  associatePrimaryKey: function (klayModel, sequelizeObject) {
    var automanaged = _.get(klayModel, 'spec.db.automanaged', []);

    // Setup the primaryKey
    var pkName = utils.getPrimaryKeyField(klayModel);
    sequelizeObject[pkName].primaryKey = true;
    sequelizeObject[pkName].nullable = false;

    // Add the autoincrement fields
    _.filter(automanaged, {supplyWith: 'autoincrement'}).forEach(function (item) {
      sequelizeObject[item.property].autoIncrement = true;
    });
  },
  associateForeignKeys: function (klayModel, sequelizeModel, dependencies) {
    var constraints = _.get(klayModel, 'spec.db.constraints', []);

    // Add the foreign key relationships
    _.filter(constraints, {type: 'reference'}).forEach(function (constraint) {
      var foreignKey = _.get(constraint, 'properties.0');
      assert.equal(constraint.properties.length, 1, 'multi-key foreign keys not yet supported');

      var modelName = _.get(constraint, 'meta.model', foreignKey.replace(/(_)?id$/ig, ''));
      var otherModel = _.get(dependencies, [modelName + ':sql', '_sequelizeModel']);
      sequelizeModel.belongsTo(otherModel, {foreignKey, onDelete: 'CASCADE'});
    });
  },
};
