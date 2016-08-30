var assert = require('assert');
var _ = require('lodash');

module.exports = function () {
  var models = {};
  var prebaked = {};
  var globalExtensions = [];

  function getModelDefOrThrow(name) {
    if (models[name]) {
      return models[name];
    } else {
      throw new Error(`unknown model: ${name}`);
    }
  }

  function getExtensions(modelDef) {
    return modelDef.extensions.concat(globalExtensions);
  }

  function validateExtension(extension) {
    assert.ok(typeof extension === 'object', 'extension must be an object');
    assert.ok(typeof extension.name === 'string', 'extension must have a name');
    assert.ok(typeof extension.bake === 'function', 'extension must have a bake function');
    assert.ok(_.isNil(extension.determineDependencies) ||
      typeof extension.determineDependencies === 'function',
      'extension determineDependencies must be a function');
  }

  function createDeps(listOfDependencies, modelName) {
    return listOfDependencies.map(function (item) {
      var parts = item.split(':');
      var model = parts.length > 1 ? parts[0] : modelName;
      var extension = parts.length > 1 ? parts[1] : parts[0];
      return bake(model, extension);
    });
  }

  function bake(modelName, extension, options) {
    var modelDef = getModelDefOrThrow(modelName);
    if (typeof extension === 'string' && typeof options === 'undefined') {
      var extensionName = extension;
      var extensions = getExtensions(modelDef);
      var extensionDef = _.find(extensions, item => item.extension.name === extensionName);
      assert.ok(extensionDef, `could not find extension: ${extensionName}`);
      extension = _.get(extensionDef, 'extension');
      options = _.get(extensionDef, 'options');
    }

    options = options || {};
    validateExtension(extension);

    // Check if we've already baked this model
    var prebakedInst = _.get(prebaked, [modelName, extension.name]);
    if (prebakedInst) {
      return prebakedInst;
    }

    var determineDeps = _.get(extension, 'determineDependencies', _.noop);
    var dependsOn = determineDeps(modelDef, options) || [];
    var dependencies = createDeps(dependsOn, modelName);
    var result = extension.bake(modelDef, options, dependencies);

    var prebakedOfModel = prebaked[modelName] || {};
    prebakedOfModel[extension.name] = result;
    prebaked[modelName] = prebakedOfModel;

    return result;
  }

  var kiln = {
    add: function (modelName, model, metadata) {
      metadata = metadata || {};

      models[modelName] = {
        name: modelName,
        model, metadata,
        extensions: [],
      };

      return kiln;
    },
    extend: function (modelName, extension, options) {
      if (typeof modelName !== 'string' && arguments.length < 3) {
        options = extension;
        extension = modelName;
        modelName = null;
      }

      var extensions = modelName ?
        getModelDefOrThrow(modelName).extensions :
        globalExtensions;

      options = options || {};
      validateExtension(extension);
      extensions.push({options, extension});
      return kiln;
    },
    bake: function (modelName, extension, options) {
      if (arguments.length === 0) {
        return _.mapValues(models, function (value, modelName) {
          return kiln.bake(modelName);
        });
      } else if (arguments.length === 1) {
        var modelDef = getModelDefOrThrow(modelName);
        return _(getExtensions(modelDef)).
          map(item => _.assign({
            name: item.extension.name,
            result: bake(modelName, item.extension, item.options),
          })).
          keyBy('name').
          mapValues('result').
          value();
      } else {
        return bake(modelName, extension, options);
      }
    },
    getModels: function () {
      return _.cloneDeep(models);
    },
    clearCache: function () {
      prebaked = {};
      return kiln;
    },
    reset: function () {
      models = {};
      globalExtensions = [];
      return kiln.clearCache();
    },
  };

  return kiln;
};
