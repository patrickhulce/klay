var extension = require('./extension');
var Options = require('./Options');

module.exports = function (opts) {
  return new Options(opts);
};

module.exports.extension = extension;
