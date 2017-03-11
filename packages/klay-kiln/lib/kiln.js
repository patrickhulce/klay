const assert = require('assert')
const _ = require('lodash')

module.exports = function () {
  let models = {}
  let prebaked = {}
  let globalExtensions = []

  function getModelDefOrThrow(name) {
    if (models[name]) {
      return models[name]
    } else {
      throw new Error(`unknown model: ${name}`)
    }
  }

  function getExtensions(modelDef) {
    return modelDef.extensions.concat(globalExtensions)
  }

  function validateExtension(extension) {
    assert.ok(typeof extension === 'object', 'extension must be an object')
    assert.ok(typeof extension.name === 'string', 'extension must have a name')
    assert.ok(typeof extension.bake === 'function', 'extension must have a bake function')
    assert.ok(_.isNil(extension.determineDependencies) ||
      typeof extension.determineDependencies === 'function',
      'extension determineDependencies must be a function')
  }

  function createDeps(listOfDependencies, modelName, kiln) {
    return _(listOfDependencies)
      .map(item => {
        const parts = item.split(':')
        const model = parts.length > 1 ? parts[0] : modelName
        const extension = parts.length > 1 ? parts[1] : parts[0]
        return {name: item, value: bake.call(kiln, model, extension)}
      })
      .keyBy('name')
      .mapValues('value')
      .assign({kiln})
      .value()
  }

  function bake(modelName, extension, options) {
    const kilnRef = this
    const modelDef = getModelDefOrThrow(modelName)
    if (typeof extension === 'string') {
      const extensionName = extension
      const extensions = getExtensions(modelDef)
      const extensionDef = _.find(extensions, item => item.extension.name === extensionName)
      assert.ok(extensionDef, `could not find extension: ${extensionName}`)
      extension = _.get(extensionDef, 'extension')
      options = _.assign({}, _.get(extensionDef, 'options'), options)
    }

    options = options || {}
    validateExtension(extension)

    // Check if we've already baked this model
    const prebakedInst = _.get(prebaked, [modelName, extension.name])
    if (prebakedInst && _.isEqual(prebakedInst.options, options)) {
      return prebakedInst.inst
    }

    const determineDeps = _.get(extension, 'determineDependencies', _.noop)
    const dependsOn = determineDeps(modelDef, options) || []
    const dependencies = createDeps(dependsOn, modelName, kilnRef)
    const result = extension.bake(modelDef, options, dependencies)

    const prebakedOfModel = prebaked[modelName] || {}
    prebakedOfModel[extension.name] = {inst: result, options}
    prebaked[modelName] = prebakedOfModel

    return result
  }

  const kiln = {
    add(modelName, model, metadata) {
      metadata = metadata || {}

      models[modelName] = {
        name: modelName,
        model, metadata,
        extensions: [],
      }

      return kiln
    },
    extend(modelName, extension, options) {
      if (typeof modelName !== 'string' && arguments.length < 3) {
        options = extension
        extension = modelName
        modelName = null
      }

      const extensions = modelName ?
        getModelDefOrThrow(modelName).extensions :
        globalExtensions

      options = options || {}
      validateExtension(extension)
      extensions.push({options, extension})
      return kiln
    },
    bake(modelName, extension, options) {
      if (arguments.length === 0) {
        return _.mapValues(models, (value, modelName) => {
          return kiln.bake(modelName)
        })
      } else if (arguments.length === 1) {
        const modelDef = getModelDefOrThrow(modelName)
        return _(getExtensions(modelDef))
          .map(item => _.assign({
            name: item.extension.name,
            result: bake.call(kiln, modelName, item.extension, item.options),
          }))
          .keyBy('name')
          .mapValues('result')
          .value()
      } else {
        return bake.call(kiln, modelName, extension, options)
      }
    },
    getModels() {
      return _.cloneDeep(models)
    },
    clearCache() {
      prebaked = {}
      return kiln
    },
    reset() {
      models = {}
      globalExtensions = []
      return kiln.clearCache()
    },
  }

  return kiln
}
