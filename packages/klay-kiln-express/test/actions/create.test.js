const _ = require('lodash')
const request = require('supertest')
const steps = require('./steps')

function addRoutes(kiln, app) {
  const result = kiln.bake('user', 'express-router', {
    routes: {
      'POST /users': {action: 'create', validation: {body: {allowedAsList: true}}},
    },
  })

  app.use(result.router)
}

describedb('actions/create.js', () => {
  const shared = steps.init(addRoutes)

  const record = _.assign({metadata: {foo: 'bar'}}, fixtures.data.users[0])
  const records = fixtures.data.users.slice(1, 3)
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
      post(record, res => {
        res.status.should.equal(200)

        const user = res.body
        user.should.have.property('id')
        user.should.have.property('createdAt')
        user.should.have.property('updatedAt')

        _.omit(user, ['id', 'createdAt', 'updatedAt']).should.eql(record)
      }, done)
    })

    it('should create multiple records', done => {
      post(records, res => {
        res.status.should.equal(200)

        res.body.should.have.length(2)
        res.body.forEach(item => {
          item.should.have.property('id')
          item.should.have.property('createdAt')
          item.should.have.property('updatedAt')
        })
      }, done)
    })
  })

  context('failure', () => {
    it('should validate an incomplete record', done => {
      post(_.omit(record, ['age']), res => {
        res.status.should.equal(400)
      }, done)
    })

    it('should validate record with excess properties', done => {
      post(_.assign({id: 15}, record), res => {
        res.status.should.equal(400)
      }, done)
    })

    it('should prevent a duplicate record', done => {
      post(record, res => {
        res.status.should.equal(500)
        res.body.message.should.match(/constraint.*violated/)
      }, done)
    })

    it('should validate a list of records', done => {
      post(recordsB.concat([{foo: 'what'}]), res => {
        res.status.should.equal(400)
      }, done)
    })

    it('should prevent duplicates in a list', done => {
      post(recordsB.concat(record), res => {
        res.status.should.equal(500)
        res.body.message.should.match(/constraint.*violated/)
      }, done)
    })
  })
})
