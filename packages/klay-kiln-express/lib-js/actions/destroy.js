const _ = require('lodash')
const klay = require('klay')

const findDbModel = require('../shared/findDbModel')
const paramifyModel = require('../shared/paramifyModel')
const querifyModel = require('../shared/querifyModel')
const queryBuilderFactory = require('../shared/queryBuilder')

function generateModel(model, options) {
  const {minLimit, maxLimit, defaultLimit} = options
  const limitModel = klay.builders.integer()
    .min(minLimit).max(maxLimit).default(defaultLimit)
    .optional()

  const querifiedModel = querifyModel(model, options)
  return querifiedModel.merge(klay.builders.object({limit: limitModel}))
}

function destroyOne(dbModel) {
  return function (req, res, next) {
    res.promise = dbModel.destroyOne(req.validated.params)
    next()
  }
}

function destroyAll(dbModel) {
  return function (req, res, next) {
    const query = _.size(req.query) > 0 ? req.validated.query : req.validated.body
    const queryBuilder = queryBuilderFactory(dbModel, query)

    res.promise = queryBuilder.fetchCount().then(total => {
      const params = queryBuilder.toObject()
      const destroyWhere = params.where || {}
      const destroyOptions = params.limit === 0 ? {} : _.pick(params, ['limit'])

      return dbModel.destroy(destroyWhere, destroyOptions).then(() => {
        return {total}
      })
    })

    next()
  }
}

module.exports = {
  options: {
    byId: true,
    minLimit: 0,
    maxLimit: 1000,
    defaultLimit: 0,
  },
  paramsModel(modelDef, options) {
    return options.byId ? paramifyModel(modelDef.model, modelDef.name).required() : null
  },
  queryModel(modelDef, options) {
    return options.byId ? null : generateModel(modelDef.model, options).optional()
  },
  bodyModel(modelDef, options) {
    return options.byId ? null : generateModel(modelDef.model, options).optional()
  },
  handler(modelDef, options, extOptions, dependencies) {
    const dbModel = findDbModel(modelDef.name, options, dependencies)
    return options.byId ? destroyOne(dbModel, options) : destroyAll(dbModel, options)
  },
}
