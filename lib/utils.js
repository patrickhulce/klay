const _ = require('lodash')
const Model = require('./Model')

const utils = {
  mergeAndUnionRecursively(objA, objB) {
    _.mergeWith(objA, objB, (objValue, srcValue) => {
      if (_.isArray(objValue)) {
        return objValue.concat(srcValue)
      } else if (_.isArray(srcValue)) {
        return [objValue].concat(srcValue)
      } else if (typeof objValue === 'object') {
        return utils.mergeAndUnionRecursively(objValue, srcValue)
      } else {
        return srcValue
      }
    })
  },
  builderFromFormat(type, format, extra) {
    return function (options) {
      return (extra || _.identity)(Model.construct({
        type,
        format,
        formatOptions: options
      }))
    }
  },
  buildersFromFormats(formats, extras) {
    if (!extras) { extras = {} }

    return _(formats).
      map((formats, type) => {
        return _.reduce(formats, (current, format) => {
          const builder = utils.builderFromFormat(type, format, extras[format])
          return _.set(current, format, builder)
        }, {})
      }).
      reduce(_.merge, {})
  }
}

module.exports = utils
