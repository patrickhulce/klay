const {kiln, sqlExtension} = require('../examples/app/kiln')
const app = require('../examples/app/app').app

describe('e2e', () => {
  const state = {}

  describe('initialize', () => {
    it('should sync the database', async () => {
      await sqlExtension.sync({force: true})
    })

    it('should start the server', done => {
      const server = app.listen(() => {
        state.server = server
        state.port = server.address().port
        state.baseURL = `http://localhost:${state.port}`
        done()
      })
    })

    it('should buildAll', () => {
      const artifacts = kiln.buildAll()
      // 3 SQL models
      expect(artifacts).toHaveLength(3)
    })
  })

  require('./scenarios/create-account.test.js')(state)
  require('./scenarios/create-user.test.js')(state)
  require('./scenarios/create-many-users.test.js')(state)
  require('./scenarios/create-posts.test.js')(state)

  describe('teardown', () => {
    it('should power down the server', done => {
      state.server.close(done)
    })
  })
})
