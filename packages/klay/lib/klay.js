const _ = require('lodash')
const assert = require('./assert')
const utils = require('./utils')
const Model = require('./Model')

let _initialized, _initializedWith
const klay = function (options) {
  options = _.assign({
    extensions: ['builders', 'date', 'minmax', 'strings']
  }, options)

  if (_initialized && _.isEqual(_initializedWith, options)) {
    return klay
  }

  klay.reset();
  (options.extensions || []).forEach(extName => {
    klay.use(require(`./extensions/${extName}`))
  })

  _initialized = true
  _initializedWith = options
  return klay
}

klay.use = function (extension) {
  if (typeof extension === 'function') {
    extension = extension(spec => klay.Model.construct(spec))
  }

  if (extension.types) {
    Model.types = Model.types.concat(extension.types)
  }

  if (extension.formats) {
    for (const type in extension.formats) {
      if (!Model.formats[type]) { Model.formats[type] = [] }
      const oldFormats = Model.formats[type]
      const newFormats = extension.formats[type]

      assert.equal(_.intersection(oldFormats, newFormats).length, 0, 'duplicate format')
      Model.formats[type] = oldFormats.concat(newFormats)
    }
  }

  if (extension.defaults) {
    Object.assign(Model.defaults, extension.defaults)
  }

  if (extension.hooks) {
    _.forEach(extension.hooks, (item, key) => {
      if (!_.isArray(item)) { item = [item] }
      item.forEach(f => assert.typeof(f, 'function', 'hook must be a function'))
      extension.hooks[key] = item
    })

    _.mergeWith(Model.hooks, extension.hooks, (a, b) => {
      return a ? a.concat(b) : b
    })
  }

  if (extension.builders === true) {
    const builders = utils.buildersFromFormats(extension.formats, extension.builderExtras)
    Object.assign(klay.builders, builders)
  } else if (extension.builders) {
    Object.assign(klay.builders, extension.builders)
  }

  if (extension.transformations) {
    _.merge(Model.transformations, extension.transformations)
  }

  if (extension.validations) {
    utils.mergeAndUnionRecursively(Model.validations, extension.validations)
  }

  if (typeof extension.extend === 'object') {
    Object.assign(klay.Model.prototype, extension.extend)
  } else if (typeof extension.extend === 'function') {
    const base = Object.assign({}, Model.prototype, klay.Model.prototype)
    const prototypeExtensions = extension.extend(base)
    Object.assign(klay.Model.prototype, prototypeExtensions)
  }

  return klay
}

klay.reset = function () {
  Model.reset()
  _initialized = false
  _initializedWith = undefined
  klay.builders = {}

  const ExtendedModel = function () { return Model.apply(this, arguments) }
  ExtendedModel.prototype = _.create(Model.prototype, {constructor: ExtendedModel})
  ExtendedModel.construct = Model.construct = function (spec) {
    return new ExtendedModel(spec)
  }

  klay.Model = ExtendedModel
}

module.exports = klay()
