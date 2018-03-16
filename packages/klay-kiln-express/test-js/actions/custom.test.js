const _ = require('lodash')
const klay = require('klay-core')
const request = require('supertest')
const steps = require('./steps')

function addRoutes(kiln, app) {
  const result = kiln.bake('user', 'express-router', {
    routes: {
      'GET /:foo/:bar': {
        queryModel() {
          return klay.builders.object({
            optionA: klay.builders.boolean(),
          })
        },
        paramsModel() {
          return klay.builders.object({
            foo: klay.builders.string(),
            bar: klay.builders.integer(),
          })
        },
        handler(modelDef) {
          return function (req, res) {
            res.json({
              hello: 'custom',
              params: req.validated.params,
              query: req.validated.query,
            })
          }
        },
      },
    },
  })

  app.use(result.router)
}

describedb('actions/custom', () => {
  const shared = steps.init(addRoutes)

  const get = function (url, func, done) {
    return request(shared.app)
      .get(url)
      .expect(func)
      .end(done)
  }

  it('should use handler', done => {
    get('/something/123', res => {
      res.status.should.equal(200)
      res.body.should.have.property('hello', 'custom')
    }, done)
  })

  it('should use paramsModel', done => {
    get('/something/foo', res => {
      res.status.should.equal(400)
    }, done)
  })

  it('should use queryModel', done => {
    get('/something/12?optionA=mist', res => {
      res.status.should.equal(400)
    }, done)
  })

  it('should combine all', done => {
    get('/something/123?optionA=true', res => {
      const query = {optionA: true}
      const params = {foo: 'something', bar: 123}
      res.body.should.eql({hello: 'custom', params, query})
    }, done)
  })
})
