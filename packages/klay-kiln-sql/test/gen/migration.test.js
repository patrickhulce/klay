const Sequelize = require('sequelize')
const createMigration = require('../../lib/gen/migration').createNewMigrationFile
const utils = require('../utils')

describe('lib/gen/migration.ts', () => {
  describe('#createNewMigrationFile', () => {
    it('should create a migration file', () => {
      const {kiln} = utils.setup()
      const migration = createMigration(kiln)
      expect(migration).toMatchSnapshot()
    })
  })
})
