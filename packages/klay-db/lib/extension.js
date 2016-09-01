var Options = require('./Options');

module.exports = function () {
  var delegateToOptions = function (name) {
    return function () {
      var options = new Options(this.spec.db || {});
      options = options[name].apply(options, arguments);
      return this.db(options);
    };
  };

  return {
    extend: {
      db: function (options) {
        options = new Options(options).toObject();
        return this._with({db: options});
      },
      dbindex: delegateToOptions('index'),
      dbconstrain: delegateToOptions('constrain'),
      dbautomanage: delegateToOptions('automanage'),
    },
  };
};
