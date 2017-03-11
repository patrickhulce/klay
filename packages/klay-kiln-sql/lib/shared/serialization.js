const _ = require('lodash')

function mapValues(klayModel, object, mapper) {
  const children = _.get(klayModel, 'spec.children', [])

  return _.mapValues(object, (value, key) => {
    const model = _.find(children, {name: key})
    const type = _.get(model, 'model.spec.type', 'string')
    return mapper(value, type)
  })
}

function toStorage(klayModel, object) {
  return mapValues(klayModel, object, (value, type) => {
    return _.includes(['object', 'array'], type) ? JSON.stringify(value) : value
  })
}

function fromStorage(klayModel, sqlObject) {
  return mapValues(klayModel, sqlObject, (value, type) => {
    return _.includes(['object', 'array'], type) ? JSON.parse(value) : value
  })
}

module.exports = {toStorage, fromStorage}
