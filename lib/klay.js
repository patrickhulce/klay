var _ = require('lodash');
var utils = require('./utils');
var Model = require('./Model');

var _initializedWith;
var klay = function (options) {
  options = Object.assign({
    extensions: ['builders']
  }, options);

  if (_.isEqual(_initializedWith, options)) {
    return klay;
  }

  klay.reset();
  (options.extensions || []).forEach(function (extName) {
    klay.use(require(`./extensions/${extName}`));
  });

  _initializedWith = options;
  return klay;
};

klay.use = function (extension) {
  if (typeof extension === 'function') {
    extension = extension(spec => klay.Model.construct(spec));
  }

  if (extension.types) {
    Model.types = Model.types.concat(extension.types);
  }

  if (extension.formats) {
    for (var type in extension.formats) {
      if (!Model.formats[type]) { Model.formats[type] = []; }
      Model.formats[type] = Model.formats[type].concat(extension.formats[type]);
    }
  }

  if (extension.defaults) {
    Object.assign(Model.defaults, extension.defaults);
  }

  if (extension.builders === true) {
    var builders = utils.buildersFromFormats(extension.formats, extension.builderExtras);
    Object.assign(klay.builders, builders);
  } else if (extension.builders) {
    Object.assign(klay.builders, extension.builders);
  }

  if (extension.transformations) {
    _.merge(Model.transformations, extension.transformations);
  }

  if (extension.validations) {
    utils.mergeAndUnionRecursively(Model.validations, extension.validations);
  }

  if (typeof extension.extend === 'object') {
    Object.assign(klay.Model.prototype, extension.extend);
  } else if (typeof extension.extend === 'function') {
    var base = Object.assign({}, Model.prototype, klay.Model.prototype);
    var prototypeExtensions = extension.extend(base);
    Object.assign(klay.Model.prototype, prototypeExtensions);
  }

  return klay;
};

klay.reset = function () {
  Model.reset();
  _initializedWith = undefined;
  klay.builders = {};

  var ExtendedModel = function () { return Model.apply(this, arguments); };
  ExtendedModel.prototype = _.create(Model.prototype, {constructor: ExtendedModel});
  ExtendedModel.construct = Model.construct = function (spec) {
    return new ExtendedModel(spec);
  };

  klay.Model = ExtendedModel;
};

klay.reset();
module.exports = klay;
