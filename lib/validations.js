var _ = require('lodash');

module.exports = {
  boolean: {
    __default: function (value) {
      assert.equal(typeof value, 'boolean', 'typeof');
    }
  },
  conditional: {
    __default: function (value, root, path) {
      var options = this._getOrThrow('options');
      var defaultOption = _.find(options, opt => !opt.condition);
      var applicableOptions = _.filter(options, opt => (opt.condition || _.noop)(value));
      if (applicableOptions.length > 1) {
        throw Error('conditional model ambiguity: mutiple conditions should not apply');
      } else if (applicableOptions.length === 0 && !defaultOption) {
        throw Error('conditional model ambiguity: no applicable model');
      }

      var option = applicableOptions[0] || defaultOption;
      option.model._validate(value, root, path);
    }
  }
};
