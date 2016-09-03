var _ = require('lodash');
var Options = require('../Options');

function replaceNames(name, db) {
  return {
    automanaged: (db.automanaged || []).
      filter(item => _.get(item, 'property') === '__childplaceholder__').
      map(item => _.set(item, 'property', name)),
    constraints: (db.constraints || []).
      filter(item => _.get(item, 'properties.0') === '__childplaceholder__').
      map(item => _.set(item, 'properties.0', name)).
      map(item => _.set(item, 'name', item.name.replace(/__childplaceholder__/, name))),
    indexes: (db.indexes || []).
      filter(item => _.get(item, '0.property') === '__childplaceholder__').
      map(item => _.set(item, '0.property', name)),
  };
}

function merge(dest, child) {
  var replacedNames = replaceNames(child.name, _.cloneDeep(child.model.spec.db || {}));

  var append = function (name) {
    var newList = (dest[name] || []).concat(replacedNames[name]);
    _.set(dest, name, _.uniqWith(newList, _.isEqual));
  };

  append('indexes');
  append('automanaged');
  append('constraints');
}

module.exports = function (modelDb, modelChildren) {
  var options = new Options(modelDb || {});
  if (_.isArray(modelChildren)) {
    modelChildren.forEach(function (child) {
      merge(options.spec, child);
    });
  }

  return options;
};
