const _ = require('lodash')
const request = require('supertest')
const steps = require('./steps')

function addRoutes(kiln, app) {
  const result = kiln.bake('user', 'express-router', {
    routes: {
      'GET /users': {action: 'list', range: true},
      'POST /users/search': {action: 'list', queryIn: 'body', range: true},
    },
  })

  app.use(result.router)
}

describedb('actions/list.js', () => {
  const shared = steps.init(addRoutes)

  function list(query, validate, done) {
    request(shared.app)
      .get(query)
      .expect(200)
      .expect(validate)
      .end(done)
  }

  function listPost(query, validate, done) {
    request(shared.app)
      .post('/users/search')
      .send(query).type('json')
      .expect(200)
      .expect(validate)
      .end(done)
  }

  context('queryIn=query', () => {
    steps.cleanAndSync(shared)
    steps.insertData(shared)

    it('should list matching equality records', done => {
      list('/users?isAdmin=true', res => {
        res.body.total.should.equal(2)
        res.body.data.should.have.length(2)
      }, done)
    })

    it('should list matching multi-equality records', done => {
      list('/users?lastName=Doe&isAdmin=false', res => {
        res.body.total.should.equal(3)
        res.body.data.should.have.length(3)
      }, done)
    })

    it('should list matching range records', done => {
      list('/users?age[$gte]=20&age[$lte]=30', res => {
        res.body.total.should.equal(3)
        res.body.data.should.have.length(3)
      }, done)
    })

    it('should limit returned fields', done => {
      list('/users?fields[]=email&fields[]=firstName', res => {
        res.body.total.should.equal(6)
        res.body.data.should.eql([
          {email: 'smith@example.com', firstName: 'Phil'},
          {email: 'jay.doe@example.com', firstName: 'Jay'},
          {email: 'jill.doe@example.com', firstName: 'Jill'},
          {email: 'jack.doe@example.com', firstName: 'Jack'},
          {email: 'jane.doe@example.com', firstName: 'Jane'},
          {email: 'john.doe@example.com', firstName: 'John'},
        ])
      }, done)
    })

    it('should order by requested field', done => {
      list('/users?orderBy[]=age+asc', res => {
        res.body.total.should.equal(6)
        res.body.data.should.have.length(6)
        res.body.data.map(x => x.age).should.eql([18, 21, 24, 27, 54, 62])
      }, done)
    })

    it('should page correctly', done => {
      list('/users?orderBy[]=age+desc&limit=3&offset=2', res => {
        res.body.total.should.equal(6)
        res.body.data.should.have.length(3)
        res.body.data.map(x => x.age).should.eql([27, 24, 21])
        res.body.limit.should.equal(3)
        res.body.offset.should.equal(2)
      }, done)
    })
  })

  context('queryIn=body', () => {
    steps.cleanAndSync(shared)
    steps.insertData(shared)

    it('should list matching equality records', done => {
      listPost({isAdmin: true}, res => {
        res.body.total.should.equal(2)
        res.body.data.should.have.length(2)
      }, done)
    })

    it('should list matching multi-equality records', done => {
      listPost({lastName: 'Doe', isAdmin: false}, res => {
        res.body.total.should.equal(3)
        res.body.data.should.have.length(3)
      }, done)
    })

    it('should list matching range records', done => {
      listPost({age: {$gte: 20, $lte: 30}}, res => {
        res.body.total.should.equal(3)
        res.body.data.should.have.length(3)
      }, done)
    })

    it('should limit returned fields', done => {
      listPost({fields: ['email', 'firstName']}, res => {
        res.body.total.should.equal(6)
        res.body.data.should.eql([
          {email: 'smith@example.com', firstName: 'Phil'},
          {email: 'jay.doe@example.com', firstName: 'Jay'},
          {email: 'jill.doe@example.com', firstName: 'Jill'},
          {email: 'jack.doe@example.com', firstName: 'Jack'},
          {email: 'jane.doe@example.com', firstName: 'Jane'},
          {email: 'john.doe@example.com', firstName: 'John'},
        ])
      }, done)
    })

    it('should order by requested field', done => {
      listPost({orderBy: ['age asc']}, res => {
        res.body.total.should.equal(6)
        res.body.data.should.have.length(6)
        res.body.data.map(x => x.age).should.eql([18, 21, 24, 27, 54, 62])
      }, done)
    })

    it('should page correctly', done => {
      listPost({orderBy: ['age desc'], limit: 3, offset: 2}, res => {
        res.body.total.should.equal(6)
        res.body.data.should.have.length(3)
        res.body.data.map(x => x.age).should.eql([27, 24, 21])
        res.body.limit.should.equal(3)
        res.body.offset.should.equal(2)
      }, done)
    })
  })
})
