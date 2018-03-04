const expect = require('chai').expect
const Sequelize = require('sequelize')
const Extension = require('../dist/extension').SQLExtension
const utils = require('./utils')

describe('lib/extension.ts', () => {
  describe('.sync', () => {
    it('should sync the database', async () => {
      const extension = new Extension(utils.dbOptions)
      extension.sequelize.define('thing', {x: Sequelize.TEXT})
      await extension.sync({force: true})
      const results = await extension.sequelize.query('DESC thing')
      expect(results).to.have.nested.property('0.1.Field', 'x')
      expect(results).to.have.nested.property('0.1.Type', 'text')
    })

    it('should re-sync the database', async () => {
      const extension = new Extension(utils.dbOptions)
      extension.sequelize.define('thing', {y: Sequelize.INTEGER})
      await extension.sync({force: true})
      const results = await extension.sequelize.query('DESC thing')
      expect(results).to.have.nested.property('0.1.Field', 'y')
      expect(results).to.have.nested.property('0.1.Type', 'int(11)')
    })
  })

  describe('.build', () => {
    it('should build an executor', () => {
      const extension = new Extension(utils.dbOptions)
      const model = utils.createModels().user
      const executor = extension.build({name: 'user', model, meta: {}})
      expect(executor.sequelize).to.be.an('object')
      expect(executor.create).to.be.a('function')
      expect(executor.createAll).to.be.a('function')
    })
  })
})
