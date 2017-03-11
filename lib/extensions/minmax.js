const _ = require('lodash')
const assert = require('../assert')

const message = function (name, verb) {
  const value = this.spec[name]
  const direction = name === 'min' ? 'greater' : 'less'
  return `value must ${verb} ${direction} than or equal to ${value}`
}

const validation = (verb, map) => function (value) {
  if (typeof this.spec.min === 'number') {
    assert.ok(map(value) >= this.spec.min, message.call(this, 'min', verb))
  }

  if (typeof this.spec.max === 'number') {
    assert.ok(map(value) <= this.spec.max, message.call(this, 'max', verb))
  }
}

module.exports = function () {
  return {
    builders: true,
    formats: {number: ['integer']},
    validations: {
      number: {
        integer(value) {
          assert.ok(value === Math.floor(value), 'value must be an integer')
        },
        __default: [validation('be', _.identity)],
      },
      string: {
        __default: [validation('have length', _.size)],
      },
      array: {
        __default: [validation('have length', _.size)],
      },
      object: {
        __default: [validation('have number of keys', _.size)],
      },
    },
    extend: {
      min(min) {
        assert.ok(typeof min === 'number', 'min must be a number')
        return this._with({min})
      },
      max(max) {
        assert.ok(typeof max === 'number', 'max must be a number')
        return this._with({max})
      },
      length(value) {
        return this._with({min: value, max: value})
      },
    },
  }
}
