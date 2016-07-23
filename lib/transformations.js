var _ = require('lodash');
var assert = require('./assert');
var ValidationResult = require('./ValidationResult');

module.exports = {
  boolean: {
    __default: function (value) {
      if (value === 'true') {
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
      if (typeof value === 'string') {
        var x = Number(value);
        return !value || _.isNaN(x) ? value : x;
      } else {
        return value;
      }
    }
  },
  object: {
    __default: function (value, root, path) {
      var children = this.spec.children;
      if (!children) { return value; }
      var pathPrefix = path ? path + '.' : '';

      assert.typeof(value, 'object');

      var transformedRoot = {};
      var priorityByType = {object: 1, conditional: 2};
      var orderedChildren = _.sortBy(children, item => priorityByType[item.model.spec.type] || 0);
      var validationResults = _.map(orderedChildren, function (item) {
        var validation = item.model._validate(
          value[item.name],
          transformedRoot,
          pathPrefix + item.name
        );

        _.set(transformedRoot, item.name, validation.value);
        return {name: item.name, validation: validation};
      });

      return ValidationResult.coalesce(validationResults, {});
    }
  },
  array: {
    __default: function (value, root, path) {
      if (!this.spec.children) { return value; }
      var pathPrefix = path ? path + '.' : '';

      assert.typeof(value, 'array');

      var validationResults = _.map(value, function (value, index) {
        return {
          name: index,
          validation: this.spec.children._validate(value, root, pathPrefix + index),
        };
      }.bind(this));

      return ValidationResult.coalesce(validationResults, []);
    }
  },
};
