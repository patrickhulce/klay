const _ = require('lodash')
const bluebird = require('bluebird')
const QueryBuilder = require('./QueryBuilder')
const sequelizeModels = require('./sequelize/models')
const operations = require('./operations')
const utils = require('./shared')

function asOneOrList(operation, startTransaction) {
  return function (object, options) {
    if (_.isArray(object)) {
      return startTransaction(transaction => {
        const opts = _.assign({}, options, {transaction})
        return bluebird.mapSeries(object, item => operation(item, opts))
      })
    } else {
      return operation(object, options)
    }
  }
}

module.exports = function (modelDef, options) {
  const sequelize = options.sequelize
  const dependencies = options.dependencies || {}
  const sequelizeModel = sequelizeModels.fromKlayModel(modelDef, options, dependencies)

  const transaction = sequelize.transaction.bind(sequelize)
  let create = operations.create(modelDef, sequelizeModel, dependencies).run
  let update = operations.update(modelDef, sequelizeModel, dependencies).run
  let upsert = operations.upsert(modelDef, sequelizeModel, dependencies).run
  const patch = operations.patch(modelDef, sequelizeModel, dependencies).run
  const setPrimaryKey = utils.setPrimaryKey(modelDef.model)
  const findByPrimaryKey = utils.findByPrimaryKey(modelDef.model, dependencies)

  if (_.get(options, 'createAsList', true)) {
    create = asOneOrList(create, transaction)
  }

  if (_.get(options, 'updateAsList', true)) {
    update = asOneOrList(update, transaction)
  }

  if (_.get(options, 'upsertAsList', true)) {
    upsert = asOneOrList(upsert, transaction)
  }

  const dbModel = {
    _sequelize: sequelize,
    _sequelizeModel: sequelizeModel,
    findById: findByPrimaryKey,
    transaction, create, update, upsert, patch,
    find(query, options) {
      return dbModel.queryBuilder(query).fetchResults(options)
    },
    findOne(query, options) {
      return dbModel.queryBuilder(query).fetchResult(options)
    },
    count(query, options) {
      return dbModel.queryBuilder(query).fetchCount(options)
    },
    patchById(id, changes, options) {
      const changesObj = _.assign({}, changes, setPrimaryKey({}, id))
      return patch(changesObj, options)
    },
    destroy(where, options) {
      return sequelizeModel.destroy(_.assign({where}, options))
    },
    destroyOne(where, options) {
      return sequelizeModel.destroy(_.assign({where, limit: 1}, options))
    },
    destroyById(id, options) {
      return dbModel.destroyOne(setPrimaryKey({}, id), options)
    },
    queryBuilder(query) {
      return new QueryBuilder(modelDef.model, sequelizeModel, query)
    },
  }

  dependencies.__self = dependencies[modelDef.name + ':sql'] = dbModel
  return dbModel
}
