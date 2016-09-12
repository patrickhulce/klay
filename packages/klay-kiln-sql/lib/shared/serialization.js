var _ = require('lodash');

function mapValues(klayModel, object, mapper) {
  var children = _.get(klayModel, 'spec.children', []);

  return _.mapValues(object, function (value, key) {
    var model = _.find(children, {name: key});
    var type = _.get(model, 'model.spec.type', 'string');
    return mapper(value, type);
  });
}

function toStorage(klayModel, object) {
  return mapValues(klayModel, object, function (value, type) {
    return _.includes(['object', 'array'], type) ? JSON.stringify(value) : value;
  });
}

function fromStorage(klayModel, sqlObject) {
  return mapValues(klayModel, sqlObject, function (value, type) {
    return _.includes(['object', 'array'], type) ? JSON.parse(value) : value;
  });
}

module.exports = {toStorage, fromStorage};
