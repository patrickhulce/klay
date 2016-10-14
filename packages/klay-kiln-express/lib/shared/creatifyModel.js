var _ = require('lodash');

module.exports = function creatifyModel(model) {
  var automanaged = _.get(model, 'spec.db.automanaged', []);
  var automanagedNames = _.map(automanaged, 'property');
  return model.omit(automanagedNames).strict().required();
};
