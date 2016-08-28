var Options = require('./Options');

module.exports = function () {
  return {
    extend: {
      db: function (options) {
        options = new Options(options).toObject();
        return this._with({db: options});
      },
    },
  };
};
