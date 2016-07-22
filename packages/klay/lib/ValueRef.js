var _ = require('lodash');
var assert = require('./assert');

function ValueRef(path) {
  if (path instanceof ValueRef) {
    return path;
  } else if (_.isArray(path)) {
    return path.map(item => new ValueRef(item));
  }

  assert.equal(typeof path, 'string', 'path for ValueRef must be string');
  this.path = path;
}

module.exports = ValueRef;
