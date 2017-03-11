const _ = require('lodash')
const assert = require('./assert')

const checkOptions = function (value) {
  const options = _.get(this, 'spec.options')

  if (options) {
    assert.oneOf(value, options)
  }
}

module.exports = {
  undefined: {
    __default(value) {
      assert.typeof(value, 'undefined')
    }
  },
  boolean: {
    __default(value) {
      assert.typeof(value, 'boolean')
    }
  },
  number: {
    __default(value) {
      assert.typeof(value, 'number')
      checkOptions.call(this, value)
    }
  },
  string: {
    __default(value) {
      assert.typeof(value, 'string')
      checkOptions.call(this, value)
    }
  },
  object: {
    __default(value) {
      assert.typeof(value, 'object')
      checkOptions.call(this, value)

      if (this.spec.strict) {
        const setKeys = _.keys(value)
        const expectedKeys = _.map(this.spec.children, 'name')
        const unexpectedKeys = _.difference(setKeys, expectedKeys)
        assert.ok(!unexpectedKeys.length, `unexpected properties: ${unexpectedKeys.join(', ')}`)
      }
    }
  },
  array: {
    __default(value) {
      assert.typeof(value, 'array')
      checkOptions.call(this, value)
    }
  },
}
