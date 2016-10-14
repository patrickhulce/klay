var assert = require('assert');
var _ = require('lodash');

module.exports = function paramifyModel(model, name) {
  var constraints = _.get(model, 'spec.db.constraints', []);
  var primary = _.find(constraints, {type: 'primary'});
  var primaryKey = _.get(primary, 'properties.0');
  var children = _.get(model, 'spec.children', []);
  var primaryKeyModel = _.find(children, {name: primaryKey});
  assert.ok(primaryKeyModel, `could not find primary key for ${name}`);
  return model.pick([primaryKey]);
};
