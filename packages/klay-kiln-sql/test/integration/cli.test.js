const fs = require('fs')
const path = require('path')
const exec = require('execa').shell

const utils = require('../utils')

const cliPath = path.join(__dirname, '../../bin/cli.js')
const fixturesPath = path.join(__dirname, '../fixtures')

describe('CLI', () => {
  const state = utils.state()

  utils.steps.cleanAndSync(state)
  utils.steps.dropAllTables(state)

  afterAll(() => {
    fs.unlinkSync(state.migrationFile)
  })

  describe('migration:bootstrap', () => {
    it('should have created a migration file', async () => {
      const command = `${cliPath} migration:bootstrap --kiln-file kiln.js`
      const {stdout} = await exec(command, {cwd: fixturesPath})
      const filename = stdout.match(/(migrations.*)/)[1].trim()
      state.migrationFile = path.join(fixturesPath, filename)

      const content = fs.readFileSync(state.migrationFile, 'utf8')
      expect(content).toMatchSnapshot()
    })
  })

  describe('migrate', () => {
    it('should execute migrations', async () => {
      const command = `${cliPath} migrate --url ${utils.dbURL}`
      await exec(command, {cwd: fixturesPath})
      expect(await state.queryInterface.describeTable('users')).toMatchSnapshot()
      expect(await state.queryInterface.describeTable('photos')).toMatchSnapshot()
      const [indexes] = await state.sequelize.query('show index from users')
      expect(indexes.map(index => index.Key_name)).toMatchSnapshot()
    })
  })

  describe('migrate:revert', () => {
    it('should revert migrations', async () => {
      const command = `${cliPath} migrate:revert --url ${utils.dbURL}`
      await exec(command, {cwd: fixturesPath})
      const [results] = await state.sequelize.query('show tables')
      const tables = []
      results.forEach(row => Object.keys(row).forEach(k => tables.push(row[k])))
      expect(tables).toContain('SequelizeMeta')
      expect(tables).not.toContain('users')
      expect(tables).not.toContain('photos')
    })
  })
})
