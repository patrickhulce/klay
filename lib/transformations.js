const _ = require('lodash')
const assert = require('./assert')
const ValidationResult = require('./ValidationResult')

module.exports = {
  boolean: {
    __default(value) {
      if (value === 'true') {
        return true
      } else if (value === 'false') {
        return false
      } else {
        return value
      }
    },
  },
  number: {
    __default(value) {
      if (typeof value === 'string') {
        const x = Number(value)
        return !value || _.isNaN(x) ? value : x
      } else {
        return value
      }
    },
  },
  object: {
    __default(value, root, path) {
      const children = this.spec.children
      if (!children) {
        return value
      }
      const pathPrefix = path ? path + '.' : ''

      assert.typeof(value, 'object')

      const priorityByType = {object: 1, conditional: 2}
      const leftovers = _.omit(value, _.map(children, 'name'))
      const orderedChildren = _.sortBy(children, item => priorityByType[item.model.spec.type] || 0)

      const transformedRoot = _.assign({}, leftovers)
      const validationResults = _.map(orderedChildren, item => {
        const validation = item.model._validate(
          value[item.name],
          transformedRoot,
          pathPrefix + item.name
        )

        _.set(transformedRoot, item.name, validation.value)
        return {name: item.name, validation}
      })

      return ValidationResult
        .coalesce(validationResults, {})
        .merge(leftovers)
    },
  },
  array: {
    __default(value, root, path) {
      if (!this.spec.children) {
        return value
      }
      const pathPrefix = path ? path + '.' : ''

      assert.typeof(value, 'array')

      const validationResults = _.map(value, (value, index) => {
        return {
          name: index,
          validation: this.spec.children._validate(value, root, pathPrefix + index),
        }
      })

      return ValidationResult.coalesce(validationResults, [])
    },
  },
}
