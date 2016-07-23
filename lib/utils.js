var _ = require('lodash');
var Model = require('./Model');

var utils = {
  mergeAndUnionRecursively: function (objA, objB) {
    _.mergeWith(objA, objB, function (objValue, srcValue) {
      if (_.isArray(objValue)) {
        return objValue.concat(srcValue);
      } else if (_.isArray(srcValue)) {
        return [objValue].concat(srcValue);
      } else if (typeof objValue === 'object') {
        return utils.mergeAndUnionRecursively(objValue, srcValue);
      } else {
        return srcValue;
      }
    });
  },
  builderFromFormat: function (type, format, extra) {
    return options => (extra || _.identity)(Model.construct({
      type: type,
      format: format,
      formatOptions: options
    }));
  },
  buildersFromFormats: function (formats, extras) {
    if (!extras) { extras = {}; }

    return _(formats).
      map(function (formats, type) {
        return _.reduce(formats, function (current, format) {
          var builder = utils.builderFromFormat(type, format, extras[format]);
          return _.set(current, format, builder);
        }, {});
      }).
      reduce(_.merge, {});
  }
};

module.exports = utils;
