const Sequelize = require('sequelize')
const Extension = require('../lib/extension').SQLExtension
const utils = require('./utils')

describe('lib/extension.ts', () => {
  describe('.sync', () => {
    it('should sync the database', async () => {
      const extension = new Extension(utils.dbOptions)
      extension.sequelize.define('thing', {x: Sequelize.TEXT})
      await extension.sync({force: true})
      const results = await extension.sequelize.query('DESC thing')
      expect(results).toHaveProperty('0.1.Field', 'x')
      expect(results).toHaveProperty('0.1.Type', 'text')
    })

    it('should re-sync the database', async () => {
      const extension = new Extension(utils.dbOptions)
      extension.sequelize.define('thing', {y: Sequelize.INTEGER})
      await extension.sync({force: true})
      const results = await extension.sequelize.query('DESC thing')
      expect(results).toHaveProperty('0.1.Field', 'y')
      expect(results).toHaveProperty('0.1.Type', 'int(11)')
    })
  })

  describe('.build', () => {
    it('should build an executor', () => {
      const extension = new Extension(utils.dbOptions)
      const model = utils.createModels().user
      const executor = extension.build({name: 'user', model, meta: {}})
      expect(typeof executor.sequelize).toBe('object')
      expect(typeof executor.create).toBe('function')
      expect(typeof executor.createAll).toBe('function')
    })
  })
})
