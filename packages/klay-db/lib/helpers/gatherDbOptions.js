const _ = require('lodash')
const Options = require('../Options')

function replaceNames(name, db) {
  return {
    automanaged: (db.automanaged || [])
      .filter(item => _.get(item, 'property') === '__childplaceholder__')
      .map(item => _.set(item, 'property', name)),
    constraints: (db.constraints || [])
      .filter(item => _.get(item, 'properties.0') === '__childplaceholder__')
      .map(item => _.set(item, 'properties.0', name))
      .map(item => _.set(item, 'name', item.name.replace(/__childplaceholder__/, name))),
    indexes: (db.indexes || [])
      .filter(item => _.get(item, '0.property') === '__childplaceholder__')
      .map(item => _.set(item, '0.property', name)),
  }
}

function merge(dest, child) {
  const replacedNames = replaceNames(child.name, _.cloneDeep(child.model.spec.db || {}))

  const append = function (name) {
    const newList = (dest[name] || []).concat(replacedNames[name])
    _.set(dest, name, _.uniqWith(newList, _.isEqual))
  }

  append('indexes')
  append('automanaged')
  append('constraints')
}

module.exports = function (modelDb, modelChildren) {
  const options = new Options(modelDb || {})
  if (_.isArray(modelChildren)) {
    modelChildren.forEach(child => {
      merge(options.spec, child)
    })
  }

  return options
}
