const _ = require('lodash')
const request = require('supertest')
const steps = require('./steps')

function addRoutes(kiln, app) {
  const result = kiln.bake('user', 'express-router', {
    routes: {
      'POST /users': 'create',
      'GET /users/:id': 'read',
    },
  })

  app.use(result.router)
}

describedb('actions/read.js', () => {
  const shared = steps.init(addRoutes)

  const recordA = _.assign({metadata: {foo: 'bar'}}, fixtures.data.users[0])
  const recordB = fixtures.data.users[1]

  const post = function (data, func, done) {
    return request(shared.app)
      .post('/users')
      .type('json')
      .send(data)
      .expect(func)
      .end(done)
  }

  const get = function (id, func, done) {
    return request(shared.app)
      .get('/users/' + id)
      .expect(func)
      .end(done)
  }

  it('should create a record', done => {
    post(recordA, res => shared.userA = res.body, done)
  })

  it('should create a 2nd record', done => {
    post(recordB, res => shared.userB = res.body, done)
  })

  it('should read a record', done => {
    get(shared.userA.id, res => {
      res.status.should.equal(200)
      res.body.should.eql(shared.userA)
    }, done)
  })

  it('should read another record', done => {
    get(shared.userB.id, res => {
      res.status.should.equal(200)
      res.body.should.eql(shared.userB)
    }, done)
  })

  it('should validate the id', done => {
    get('foobar', res => {
      res.status.should.equal(400)
    }, done)
  })

  it('should not read a missing record', done => {
    get(20151, res => {
      res.status.should.equal(500)
      res.body.message.should.match(/no such record.*20151/)
    }, done)
  })
})
