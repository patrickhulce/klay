var _ = require('lodash');
var assert = require('./assert');

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
    }
  },
  string: {
    __default: function (value) {
      assert.typeof(value, 'string');
    }
  },
  date: {
    __default: function (value) {
      assert.typeof(value, 'date');
      assert.ok(!_.isNaN(value.getTime()), 'invalid date');
    }
  },
  object: {
    __default: function (value) {
      assert.typeof(value, 'object');

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
    }
  },
  conditional: {
    __default: function (value, root, path) {
      var options = this._getApplicableOptions(root);
      options[0].model._validate(value, root, path);
    }
  }
};
