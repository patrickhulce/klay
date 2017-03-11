const _ = require('lodash')
const klay = require('klay')
const Promise = require('bluebird')
const querifyModel = require('../shared/querifyModel')
const findDbModel = require('../shared/findDbModel')
const queryBuilderFactory = require('../shared/queryBuilder')

function parseOrder(value) {
  return typeof value === 'string' ? value.split(' ') : value
}

function generateAdditionalFields(model, options) {
  const maxLimit = _.get(options, 'maxLimit', 1000)
  const defaultLimit = _.get(options, 'defaultLimit', 10)
  const defaultOrder = _.get(options, 'defaultOrder', [['updatedAt', 'desc']])

  const offsetModel = klay.builders.integer().min(0).default(0).optional()
  const limitModel = klay.builders.integer().min(0).max(maxLimit).default(defaultLimit).optional()

  const fieldModel = klay.builders.enum(model.spec.children.map(child => child.name))
  const fieldsModel = klay.builders.array(fieldModel).optional()

  const orderItemModel = klay.builders.conditional()
    .option(fieldModel, (value, unused, path) => {
      return path.split('.')[2] === '0'
    })
    .option(klay.builders.enum('asc', 'desc'), (value, unused, path) => {
      return path.split('.')[2] === '1'
    })

  const orderEntryModel = klay.builders.array(orderItemModel).parse(parseOrder).length(2)
  const orderByModel = klay.builders.array(orderEntryModel).default(defaultOrder).optional()

  return [
    {name: 'offset', model: offsetModel},
    {name: 'limit', model: limitModel},
    {name: 'orderBy', model: orderByModel},
    {name: 'fields', model: fieldsModel},
  ]
}

function generateModel(model, options) {
  const querified = querifyModel(model, options)
  const additional = generateAdditionalFields(model, options)

  return klay.builders.object(additional.concat(querified.spec.children))
}

module.exports = {
  options: {
    queryIn: 'query',
  },
  queryModel(modelDef, options) {
    return options.queryIn === 'query' ?
      generateModel(modelDef.model, options) : null
  },
  bodyModel(modelDef, options) {
    return options.queryIn === 'body' ?
      generateModel(modelDef.model, options) : null
  },
  handler(modelDef, options, extOptions, dependencies) {
    const dbModel = findDbModel(modelDef.name, options, dependencies)

    return function (req, res, next) {
      const query = req.validated[options.queryIn]
      const queryBuilder = queryBuilderFactory(dbModel, query)

      res.promise = Promise.all([
        queryBuilder.fetchResults(),
        queryBuilder.fetchCount(),
      ]).spread((data, total) => {
        return _.assign({data, total}, _.pick(query, ['limit', 'offset']))
      })

      next()
    }
  },
}
