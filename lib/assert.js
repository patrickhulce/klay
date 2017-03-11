/* eslint-disable valid-typeof */
const assert = require('assert')
const _ = require('lodash')

const AssertionError = assert.AssertionError

const operators = [
  'undefined', 'nonnull',
  'typeof', 'not oneOf', 'does not match',
]

AssertionError.prototype._getErrorMessage = function (operator) {
  if (operator === 'undefined') {
    return 'expected value to be defined'
  } else if (operator === 'nonnull') {
    return 'expected value to be non-null'
  } else if (operator === 'typeof') {
    return `expected ${JSON.stringify(this.actual)} to have typeof ${this.expected}`
  } else if (operator === 'not oneOf') {
    return `expected ${this.actual} to be one of ${JSON.stringify(this.expected)}`
  } else if (operator === 'does not match') {
    return `expected ${this.actual} to match ${this.expected}`
  }
}

AssertionError.prototype.toErrorObject = function () {
  if (operators.indexOf(this.operator) === -1) {
    return {path: this.path || this.valuePath, message: this.message}
  }

  let path = this.path || this.valuePath
  const operator = this.operator
  if (this.subject) {
    path = path + '[' + this.subject + ']'
  }

  return {path, message: this._getErrorMessage(operator)}
}

assert.defined = function (actual, name) {
  if (typeof actual === 'undefined') {
    assert.fail(actual, true, undefined, 'undefined', name)
  }
}

assert.nonnull = function (actual, name) {
  if (actual === null) {
    assert.fail(actual, true, undefined, 'nonnull', name)
  }
}

assert.typeof = function (actual, expected, name) {
  let passes = false
  if (expected === 'array') {
    passes = _.isArray(actual)
  } else if (expected === 'date') {
    passes = actual instanceof Date
  } else {
    passes = typeof actual === expected
  }

  if (!passes) {
    assert.fail(actual, expected, undefined, 'typeof', name)
  }
}

assert.oneOf = function (actual, expected, name) {
  if (!_.find(expected, candidate => _.isEqual(actual, candidate))) {
    assert.fail(actual, expected, undefined, 'not oneOf', name)
  }
}

assert.match = function (actual, expected, name) {
  assert.typeof(actual, 'string', name)

  if (!actual.match(expected)) {
    assert.fail(actual, expected, undefined, 'does not match', name)
  }
}

module.exports = assert
