var _ = require('lodash');
var assert = require('./assert');

var checkOptions = function (value) {
  var options = _.get(this, 'spec.options');

  if (options) {
    assert.oneOf(value, options);
  }
};

module.exports = {
  undefined: {
    __default: function (value) {
      assert.typeof(value, 'undefined');
    }
  },
  boolean: {
    __default: function (value) {
      assert.typeof(value, 'boolean');
    }
  },
  number: {
    __default: function (value) {
      assert.typeof(value, 'number');
      checkOptions.call(this, value);
    }
  },
  string: {
    __default: function (value) {
      assert.typeof(value, 'string');
      checkOptions.call(this, value);
    }
  },
  object: {
    __default: function (value) {
      assert.typeof(value, 'object');
      checkOptions.call(this, value);

      if (this.spec.strict) {
        var setKeys = _.keys(value);
        var expectedKeys = _.map(this.spec.children, 'name');
        var unexpectedKeys = _.difference(setKeys, expectedKeys);
        assert.ok(!unexpectedKeys.length, `unexpected properties: ${unexpectedKeys.join(', ')}`);
      }
    }
  },
  array: {
    __default: function (value) {
      assert.typeof(value, 'array');
      checkOptions.call(this, value);
    }
  },
};
