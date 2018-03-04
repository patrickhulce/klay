const _ = require('lodash')
const request = require('supertest')
const steps = require('./steps')

function addRoutes(kiln, app) {
  const result = kiln.bake('user', 'express-router', {
    routes: {
      'POST /users': {action: 'upsert', validation: {body: {allowedAsList: true}}},
    },
  })

  app.use(result.router)
}

describedb('actions/upsert.js', () => {
  const shared = steps.init(addRoutes)

  const recordA = _.defaults({metadata: null}, fixtures.data.users[0])
  const recordsA = fixtures.data.users.slice(0, 3).map(o => _.defaults({metadata: null}, o))
  const recordsB = fixtures.data.users.slice(3)

  const post = function (data, func, done) {
    return request(shared.app)
      .post('/users')
      .type('json')
      .send(data)
      .expect(func)
      .end(done)
  }

  context('success', () => {
    it('should create a record', done => {
      post(recordA, res => {
        res.status.should.equal(200)

        const user = shared.recordA = res.body
        user.should.have.property('id')
        user.should.have.property('createdAt')
        user.should.have.property('updatedAt')

        _.omit(user, ['id', 'createdAt', 'updatedAt']).should.eql(recordA)
      }, done)
    })

    it('should update a record', done => {
      post(_.assign({}, recordA, {age: 100}), res => {
        res.status.should.equal(200)

        const user = res.body
        user.should.have.property('age', 100)
        user.should.have.property('updatedAt').greaterThan(shared.recordA.updatedAt)

        _.omit(user, ['age', 'updatedAt']).should.eql(_.omit(shared.recordA, ['age', 'updatedAt']))
      }, done)
    })

    it('should create/update multiple records', done => {
      post(recordsA, res => {
        res.status.should.equal(200)

        res.body.should.have.length(3)
        res.body.forEach((item, index) => {
          const expected = recordsA[index]
          item.should.have.property('id')
          const omitted = ['id', 'createdAt', 'updatedAt']
          _.omit(item, omitted).should.eql(_.omit(expected, omitted))
        })
      }, done)
    })
  })

  context('failure', () => {
    it('should validate an incomplete record for create', done => {
      post(_.omit(recordA, ['age']), res => {
        res.status.should.equal(400)
      }, done)
    })

    it('should validate an incomplete record for update', done => {
      post(_.assign({}, recordA, {id: 2012}), res => {
        res.status.should.equal(400)
        res.body.should.deep.property('errors.0.message').match(/unexpected properties/)
      }, done)
    })

    it('should validate an incomplete record in list', done => {
      post(recordsA.concat({foobar: 'bam'}), res => {
        res.status.should.equal(400)
      }, done)
    })
  })
})
