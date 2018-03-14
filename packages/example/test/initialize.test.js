const sqlExtension = require('../dist/kiln').sqlExtension
const app = require('../dist/app').app

describe('e2e', () => {
  const state = {}

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

  require('./scenarios/create-user.test.js')(state)

  it('should power down the server', done => {
    state.server.close(done)
  })
})
