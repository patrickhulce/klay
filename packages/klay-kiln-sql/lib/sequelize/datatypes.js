/* eslint-disable new-cap */
const _ = require('lodash')
const Sequelize = require('sequelize')

module.exports = {
  fromKlayModel(klayModel) {
    const type = _.get(klayModel, 'spec.type')
    const format = _.get(klayModel, 'spec.format')

    if (type === 'string') {
      const length = _.get(klayModel, 'spec.max')
      if (format === 'uuid') {
        return Sequelize.UUID
      } else if (length) {
        return Sequelize.STRING(length)
      } else {
        return Sequelize.TEXT
      }
    } else if (type === 'number') {
      if (format === 'integer') {
        return Sequelize.BIGINT
      } else {
        return Sequelize.DOUBLE
      }
    } else if (type === 'boolean') {
      return Sequelize.BOOLEAN
    } else if (type === 'date') {
      return Sequelize.DATE(6)
    } else {
      // item will be JSONified
      return Sequelize.TEXT
    }
  },
}
