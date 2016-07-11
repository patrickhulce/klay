var _ = require('lodash');
var assert = require('assert');

var fail = assert.fail;
assert.fail = function (actual, expected, message, operator, name) {
  try {
    fail(actual, expected, message, operator);
  } catch (e) {
    e.subject = name;
    throw e;
  }
};

assert.AssertionError.prototype.toErrorObject = function () {
  if (['typeof', 'not oneOf', 'does not match'].indexOf(this.operator) === -1) {
    return {path: this.path, message: 'AssertionError: ' + this.message};
  }

  var message = '';
  var path = this.path;
  var operator = this.operator;
  if (this.subject) {
    path = path + '[' + this.subject + ']';
  }

  if (operator === 'isDefined') {
    message = 'MissingValueError: expected a value but got undefined';
  } else if (operator === 'isNonnull') {
    message = 'NullValueError: expected a value but got null';
  } else if (operator === 'typeof') {
    message = 'TypeError: expected a type of ' + error.expected + 'but got ' + error.actual;
  } else if (operator) {
    message = 'ValidationError: expected a '
  }

  return {path: path, message: message};
};

assert.typeof = function (actual, expected, name) {
  if (typeof actual !== expected) {
    assert.fail(actual, expected, undefined, 'typeof', name);
  }
};

assert.oneOf = function (actual, expected, name) {
  if (!_.find(expected, candidate => _.isEqual(actual, candidate))) {
    assert.fail(actual, expected, undefined, 'not oneOf', name);
  }
};

assert.match = function (actual, expected, name) {
  assert.typeof(actual, 'string', name);

  if (!actual.match(expected)) {
    assert.fail(actual, expected, undefined, 'does not match', name);
  }
};

module.exports = assert;
