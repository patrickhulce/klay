const createMigration = require('../../lib/gen/migration').createNewMigrationFile
const utils = require('../utils')

describe('lib/gen/migration.ts', () => {
  describe('#createNewMigrationFile', () => {
    it('should create a fresh migration file', async () => {
      const {kiln} = utils.setup()
      const migration = await createMigration(kiln)
      expect(migration).toMatchSnapshot()
    })

    it('should create an incremental migration file', async () => {
      const {kiln} = utils.setup()
      const queryFn = jest.fn()
      queryFn.mockReturnValueOnce([[{Table: 'users'}]])
      queryFn.mockReturnValueOnce([[{Field: 'age'}], [{Field: 'email'}]])
      queryFn.mockReturnValueOnce([[{Key_name: 'users_unique_email'}]])

      const connection = {query: queryFn}
      const migration = await createMigration(kiln, connection)
      expect(migration).toMatchSnapshot()
    })
  })
})
