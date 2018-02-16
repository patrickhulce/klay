const _ = require('lodash')
const utils = require('./shared')

module.exports = function (klayModel, sequelizeModel, query) {
  query = query || {}

  const builder = {
    where(key, value) {
      // eslint-disable-next-line no-multi-assign
      const where = query.where = query.where || {}
      if (typeof key === 'object') {
        _.assign(where, key)
      } else if (typeof key === 'string' && typeof value !== 'undefined') {
        where[key] = value
      }
      return builder
    },
    limit(value) {
      if (typeof value !== 'undefined') {
        query.limit = Number(value)
      }
      return builder
    },
    offset(value) {
      if (typeof value !== 'undefined') {
        query.offset = Number(value)
      }
      return builder
    },
    orderBy(value) {
      if (typeof value !== 'undefined') {
        query.order = value
      }
      return builder
    },
    fields(value) {
      if (typeof value !== 'undefined') {
        query.attributes = value
      }
      return builder
    },
    toObject() {
      return _.cloneDeep(query)
    },
    fetchCount(options) {
      if (!sequelizeModel) {
        throw new Error('no model provided to QueryBuilder')
      }
      return sequelizeModel.count(_.assign({where: query.where || {}}, options))
    },
    fetchResult(options) {
      if (!sequelizeModel) {
        throw new Error('no model provided to QueryBuilder')
      }
      return sequelizeModel.findOne(_.assign({}, query, options)).then(item => {
        if (item) {
          return utils.fromStorage(klayModel, item.get())
        }
      })
    },
    fetchResults(options) {
      if (!sequelizeModel) {
        throw new Error('no model provided to QueryBuilder')
      }
      return sequelizeModel.findAll(_.assign({}, query, options)).then(items => {
        return items.map(item => {
          return utils.fromStorage(klayModel, item.get())
        })
      })
    },
  }

  return builder
}
