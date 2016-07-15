var _ = require('lodash');
var assert = require('./assert');

module.exports = {
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
  conditional: {
    __default: function (value, root, path) {
      var options = this._getOrThrow('options');
      var defaultOption = _.find(options, opt => !opt.condition);
      var applicableOptions = _.filter(options, opt => (opt.condition || _.noop)(value));
      assert.ok(applicableOptions.length || defaultOption, 'no applicable model');
      assert.ok(applicableOptions.length <= 1, 'mutiple conditions should not apply');

      var option = applicableOptions[0] || defaultOption;
      option.model._validate(value, root, path);
    }
  }
};
