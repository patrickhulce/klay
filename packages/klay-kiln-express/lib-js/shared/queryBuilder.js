const _ = require('lodash')

const specialFields = ['limit', 'offset', 'orderBy', 'fields']

function cleanseValue(value) {
  if (typeof value === 'object') {
    const undefinedKeys = _.map(value, (v, k) => typeof v === 'undefined' && k).filter(Boolean)
    return _.omit(value, undefinedKeys)
  } else {
    return value
  }
}

function queryBuilder(dbModel, query) {
  const queryBuilder = dbModel.queryBuilder()

  _.forEach(query, (value, key) => {
    if (typeof value === 'undefined') {
      return
    } else if (_.includes(specialFields, key)) {
      queryBuilder[key](value)
    } else if (typeof value !== 'undefined') {
      queryBuilder.where(key, cleanseValue(value))
    }
  })

  return queryBuilder
}

module.exports = queryBuilder
