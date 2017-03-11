/* eslint-disable valid-typeof */
const _ = require('lodash')
const Model = require('../Model')

module.exports = function (construct) {
  const typeBuilders = _(Model.types)
    .map(type => [type, () => construct({type})])
    .keyBy('0')
    .mapValues('1')
    .value()

  return {
    builders: _.assign(typeBuilders, {
      object(childModel) {
        return childModel ?
          construct({type: 'object', children: childModel}) :
          construct({type: 'object'})
      },
      array(childModel) {
        return childModel ?
          construct({type: 'array', children: childModel}) :
          construct({type: 'array'})
      },
      enum(options) {
        if (!_.isArray(options)) {
          options = _.slice(arguments)
        }

        if (!options.length) {
          throw new Error('enum must have options')
        }

        const typeofFirst = typeof options[0]
        const type = _.every(options, item => typeof item === typeofFirst) ?
          typeofFirst : 'any'
        return construct({type, options})
      },
    }),
  }
}
