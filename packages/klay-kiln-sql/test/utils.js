require('iconv-lite').encodingExists('foo')

const _ = require('lodash')
const Kiln = require('klay-kiln').Kiln
const SQLExtension = require('../dist/extension').SQLExtension
const fixtureData = require('./fixtures/data')
const createModels = require('./fixtures/models').create

const dbOptions = {
  host: process.env.KLAY_MYSQL_HOST || 'localhost',
  database: process.env.KLAY_MYSQL_DB,
  user: process.env.KLAY_MYSQL_USER || 'root',
  password: process.env.KLAY_MYSQL_PASSWORD || '',
  dialect: 'mysql',
}

const dbURL = `mysql://${dbOptions.user}${dbOptions.password ? ':' + dbOptions.password : ''}@${
  dbOptions.host
}/${dbOptions.database}`

function setup(klayModels) {
  klayModels = klayModels || createModels()
  const kiln = new Kiln()
  kiln.addModel({name: 'user', model: klayModels.user})
  kiln.addModel({name: 'photo', model: klayModels.photo})
  const extension = new SQLExtension(dbOptions)
  const sequelize = extension.sequelize
  const queryInterface = sequelize.getQueryInterface()
  kiln.addExtension({extension})
  const models = {
    user: kiln.build('user', 'sql'),
    photo: kiln.build('photo', 'sql'),
  }

  return {klayModels, kiln, extension, sequelize, models, queryInterface}
}

module.exports = {
  dbOptions,
  dbURL,
  fixtureData,
  createModels,
  setup,
  state() {
    return {}
  },
  steps: {
    cleanAndSync(state, mutateModels) {
      it('should initialize properly', async () => {
        const klayModels = createModels()
        if (mutateModels) mutateModels(klayModels)
        Object.assign(state, setup(klayModels))
        await state.extension.sync({force: true})
      })
    },
    dropAllTables(state) {
      it('should drop tables', async () => {
        await state.queryInterface.dropTable('photos')
        await state.queryInterface.dropTable('users')
        await state.queryInterface.dropTable('SequelizeMeta')
      })
    },
    insertFixtureData(state) {
      it('should insert data', async () => {
        const userPromises = fixtureData.users.map(user => state.models.user.create(user))
        const users = await Promise.all(userPromises)
        const photosByUser = _.groupBy(fixtureData.photos, 'ownerId')
        const photoGroups = _.values(photosByUser)

        const photoPromises = photoGroups.map((group, index) => {
          const user = users[index]
          const photos = group.map(photo => state.models.photo.create({...photo, ownerId: user.id}))
          return Promise.all(photos)
        })

        await Promise.all(photoPromises)
      })
    },
  },
}
