var _ = require('lodash');
var Model = require('../Model');

module.exports = function (construct) {
  var typeBuilders = _(Model.types).
    map(type => [type, () => construct({type: type})]).
    keyBy('0').
    mapValues('1').
    value();

  return {
    builders: _.assign(typeBuilders, {
      object: function (childModel) {
        return childModel ?
          construct({type: 'object', children: childModel}) :
          construct({type: 'object'});
      },
      array: function (childModel) {
        return childModel ?
          construct({type: 'array', children: childModel}) :
          construct({type: 'array'});
      },
      enum: function (options) {
        if (!_.isArray(options)) {
          options = _.slice(arguments);
        }

        if (!options.length) {
          throw new Error('enum must have options');
        }

        var typeofFirst = typeof options[0];
        var type = _.every(options, item => typeof item === typeofFirst) ?
          typeofFirst : 'any';
        return construct({type: type, options: options});
      },
    }),
  };
};
