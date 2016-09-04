var _ = require('lodash');
var assert = require('../assert');

var message = function (name, verb) {
  var value = this.spec[name];
  var direction = name === 'min' ? 'greater' : 'less';
  return `value must ${verb} ${direction} than or equal to ${value}`;
};

var validation = (verb, map) => function (value) {
  if (typeof this.spec.min === 'number') {
    assert.ok(map(value) >= this.spec.min, message.call(this, 'min', verb));
  }

  if (typeof this.spec.max === 'number') {
    assert.ok(map(value) <= this.spec.max, message.call(this, 'max', verb));
  }
};

module.exports = function () {
  return {
    builders: true,
    formats: {number: ['integer']},
    validations: {
      number: {
        integer: function (value) {
          assert.ok(value === Math.floor(value), 'value must be an integer');
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
      min: function (min) {
        assert.ok(typeof min === 'number', 'min must be a number');
        return this._with({min: min});
      },
      max: function (max) {
        assert.ok(typeof max === 'number', 'max must be a number');
        return this._with({max: max});
      },
      length: function (value) {
        return this._with({min: value, max: value});
      },
    }
  };
};