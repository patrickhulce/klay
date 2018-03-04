const _ = require('lodash')
const request = require('supertest')
const steps = require('./steps')

function addRoutes(kiln, app) {
  const result = kiln.bake('user', 'express-router', {
    routes: {
      'POST /users': 'create',
      'PUT /users': {action: 'update', byId: false, validation: {body: {allowedAsList: true}}},
      'PUT /users/:id': 'update',
    },
  })

  app.use(result.router)
}

describedb('actions/update.js', () => {
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

  const put = function (data, func, done, id) {
    return request(shared.app)
      .put('/users/' + (id || data.id))
      .type('json')
      .send(data)
      .expect(func)
      .end(done)
  }

  const putBulk = function (data, func, done) {
    return request(shared.app)
      .put('/users')
      .type('json')
      .send(data)
      .expect(func)
      .end(done)
  }

  it('should create a record', done => {
    post(recordA, res => shared.userA = res.body, done)
  })

  it('should create a 2nd record', done => {
    post(recordB, res => shared.userB = res.body, done)
  })

  context('failure', () => {
    it('should validate an incomplete record', done => {
      put(_.omit(shared.userA, ['age']), res => {
        res.status.should.equal(400)
      }, done)
    })

    it('should validate a missing record', done => {
      put(_.assign({}, shared.userA, {id: 2012}), res => {
        res.status.should.equal(500)
        res.body.message.should.match(/no such object/)
      }, done)
    })

    it('should validate a mismatched record', done => {
      put(shared.userA, res => {
        res.status.should.equal(500)
        res.body.message.should.match(/no such object/)
      }, done, 12512)
    })

    it('should validate an immutable record', done => {
      put(_.assign({}, shared.userA, {createdAt: new Date()}), res => {
        res.status.should.equal(500)
        res.body.message.should.match(/constraint.*violated/)
      }, done)
    })
  })

  context('success', () => {
    it('should update a record', done => {
      put(_.assign({}, shared.userA, {isAdmin: false, age: 100}), res => {
        res.status.should.equal(200)

        const user = res.body
        user.should.have.property('age', 100)
        user.should.have.property('isAdmin', false)
        user.should.have.property('updatedAt').greaterThan(shared.userA.updatedAt)

        const toOmit = ['age', 'isAdmin', 'updatedAt']
        _.omit(user, toOmit).should.eql(_.omit(shared.userA, toOmit))
      }, done)
    })

    it('should update multiple records', done => {
      putBulk([shared.userA, shared.userB], res => {
        res.status.should.equal(200)

        res.body.should.have.length(2)
        res.body.forEach(item => {
          item.should.have.property('updatedAt').greaterThan(shared.userB.updatedAt)
        })
      }, done)
    })
  })
})
