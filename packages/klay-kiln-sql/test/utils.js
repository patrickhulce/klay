const _ = require('lodash')
const chai = require('chai')
const chaiPromise = require('chai-as-promised')
const Kiln = require('klay-kiln').Kiln
const SQLExtension = require('../dist/extension').SQLExtension
const fixtureData = require('./fixtures/data')
const createModels = require('./fixtures/models').create

const expect = chai.expect
chai.use(chaiPromise)

const dbOptions = {
  host: process.env.KLAY_MYSQL_HOST,
  database: process.env.KLAY_MYSQL_DB,
  user: process.env.KLAY_MYSQL_USER,
  password: process.env.KLAY_MYSQL_PASSWORD || '',
  dialect: 'mysql',
}

module.exports = {
  expect,
  dbOptions,
  fixtureData,
  createModels,
  state() {
    return {}
  },
  steps: {
    cleanAndSync(state, mutateModels) {
      it('should initialize properly', async () => {
        const klayModels = createModels()
        if (mutateModels) mutateModels(klayModels)
        const kiln = new Kiln()
        const extension = new SQLExtension(dbOptions)
        const sequelize = extension.sequelize
        kiln.addModel({name: 'user', model: klayModels.user})
        kiln.addModel({name: 'photo', model: klayModels.photo})
        kiln.addExtension({extension})
        const models = {
          user: kiln.build('user', 'sql'),
          photo: kiln.build('photo', 'sql'),
        }

        Object.assign(state, {klayModels, kiln, extension, sequelize, models})
        await extension.sync({force: true})
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
    }
  },
}
