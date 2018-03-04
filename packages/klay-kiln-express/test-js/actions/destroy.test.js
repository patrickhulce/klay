const _ = require('lodash')
const request = require('supertest')
const steps = require('./steps')

function addRoutes(kiln, app) {
  const result = kiln.bake('user', 'express-router', {
    routes: {
      'GET /users': 'list',
      'DELETE /users': {byId: false, range: true, action: 'destroy'},
      'DELETE /users/:id': {byId: true, action: 'destroy'},
    },
  })

  app.use(result.router)
}

describedb('actions/destroy.js', () => {
  const shared = steps.init(addRoutes)

  context('byId', () => {
    steps.cleanAndSync(shared)
    steps.insertData(shared)

    it('should destroy a single record', done => {
      request(shared.app)
        .delete('/users/1')
        .expect(validate)
        .end(done)

      function validate(res) {
        res.status.should.equal(200)
      }
    })

    it('should no longer appear in results', done => {
      request(shared.app)
        .get('/users')
        .expect(validate)
        .end(done)

      function validate(res) {
        res.status.should.equal(200)
        res.body.should.have.property('total', 5)
      }
    })
  })

  context('queryIn=query', () => {
    steps.cleanAndSync(shared)
    steps.insertData(shared)

    it('should destroy equality records', done => {
      request(shared.app)
        .delete('/users?isAdmin=true')
        .expect(validate)
        .end(done)

      function validate(res) {
        res.status.should.equal(200)
      }
    })

    it('should no longer appear in results', done => {
      request(shared.app)
        .get('/users')
        .expect(validate)
        .end(done)

      function validate(res) {
        res.status.should.equal(200)
        res.body.should.have.property('total', 4)
      }
    })

    it('should destroy range records with limit', done => {
      request(shared.app)
        .delete('/users?age[$gte]=20&limit=2')
        .expect(validate)
        .end(done)

      function validate(res) {
        res.status.should.equal(200)
      }
    })

    it('should no longer appear in results', done => {
      request(shared.app)
        .get('/users')
        .expect(validate)
        .end(done)

      function validate(res) {
        res.status.should.equal(200)
        res.body.should.have.property('total', 2)
      }
    })
  })

  context('queryIn=body', () => {
    steps.cleanAndSync(shared)
    steps.insertData(shared)

    it('should destroy range records', done => {
      request(shared.app)
        .delete('/users')
        .send({age: {$gte: 20, $lte: 30}}).type('json')
        .expect(validate)
        .end(done)

      function validate(res) {
        res.status.should.equal(200)
      }
    })

    it('should no longer appear in results', done => {
      request(shared.app)
        .get('/users')
        .expect(validate)
        .end(done)

      function validate(res) {
        res.status.should.equal(200)
        res.body.should.have.property('total', 3)
      }
    })

    it('should destroy equality records with limit', done => {
      request(shared.app)
        .delete('/users')
        .send({isAdmin: true, limit: 1}).type('json')
        .expect(validate)
        .end(done)

      function validate(res) {
        res.status.should.equal(200)
      }
    })

    it('should no longer appear in results', done => {
      request(shared.app)
        .get('/users')
        .expect(validate)
        .end(done)

      function validate(res) {
        res.status.should.equal(200)
        res.body.should.have.property('total', 2)
      }
    })
  })
})
