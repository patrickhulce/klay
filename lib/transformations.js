var _ = require('lodash');
var assert = require('./assert');
var Model = require('./Model');
var ValidationResult = require('./ValidationResult');

module.exports = {
  boolean: {
    __default: function (value) {
      if (typeof value === 'boolean') {
        return value;
      } else if (value === 'true') {
        return true;
      } else if (value === 'false') {
        return false;
      } else {
        return value;
      }
    }
  },
  number: {
    __default: function (value) {
      if (typeof value === 'number') {
        return value;
      } else if (value === 'string') {
        return Number(value);
      } else {
        return value;
      }
    }
  },
  object: {
    __default: function (value, root, path) {
      if (!this.spec.children) { return value; }
      var pathPrefix = path ? path + '.' : '';

      assert.equal(typeof value, 'object', 'typeof');
      assert.equal(typeof this.spec.children, 'object', 'typeof:children');
      assert.equal(this.spec.children instanceof Model, false, 'isNotModel:children');

      var validationResults = _.map(this.spec.children, function (model, name) {
        return {
          name: name,
          validation: model._validate(value[name], root, pathPrefix + name),
        };
      });

      return ValidationResult.coalesce(validationResults, {});
    }
  },
  array: {
    __default: function (value, root, path) {
      if (!this.spec.children) { return value; }
      var pathPrefix = path ? path + '.' : '';

      assert.isArray(value);
      assert.instanceof(this.spec.children, Model, 'children');

      var validationResults = _.map(value, function (value, index) {
        return {
          name: index,
          validation: this.spec.children._validate(value, root, pathPrefix + index),
        };
      });

      return ValidationResult.coalesce(validationResults, []);
    }
  }
};
