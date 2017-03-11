const _ = require('lodash')
const Sequelize = require('sequelize')

const cached = []

function get(options) {
  return _.find(cached, item => _.isEqual(item.options, options))
}

module.exports = function (dbOptions) {
  const existing = get(dbOptions)

  if (dbOptions.constructor === Sequelize) {
    return dbOptions
  } else if (existing) {
    return existing.sequelize
  } else {
    const database = dbOptions.database
    const user = dbOptions.user || 'root'
    const password = dbOptions.password || null
    const options = _.omit(dbOptions, ['database', 'user', 'password'])
    const sequelize = new Sequelize(database, user, password, options)
    cached.push({options: dbOptions, sequelize})
    return sequelize
  }
}
