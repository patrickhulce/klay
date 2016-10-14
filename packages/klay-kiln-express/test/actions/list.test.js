var _ = require('lodash');
var request = require('supertest');
var steps = require('./steps');

function addRoutes(kiln, app) {
  var result = kiln.bake('user', 'express-router', {
    routes: {
      'GET /users': {action: 'list', range: true},
      'POST /users/search': {action: 'list', queryIn: 'body', range: true},
    },
  });

  app.use(result.router);
}

describedb('actions/list.js', function () {
  var shared = steps.init(addRoutes);

  function list(query, validate, done) {
    request(shared.app).
      get(query).
      expect(200).
      expect(validate).
      end(done);
  }

  function listPost(query, validate, done) {
    request(shared.app).
      post('/users/search').
      send(query).type('json').
      expect(200).
      expect(validate).
      end(done);
  }

  context('queryIn=query', function () {
    steps.cleanAndSync(shared);
    steps.insertData(shared);

    it('should list matching equality records', function (done) {
      list('/users?isAdmin=true', function validate(res) {
        res.body.total.should.equal(2);
        res.body.data.should.have.length(2);
      }, done);
    });

    it('should list matching multi-equality records', function (done) {
      list('/users?lastName=Doe&isAdmin=false', function validate(res) {
        res.body.total.should.equal(3);
        res.body.data.should.have.length(3);
      }, done);
    });

    it('should list matching range records', function (done) {
      list('/users?age[$gte]=20&age[$lte]=30', function validate(res) {
        res.body.total.should.equal(3);
        res.body.data.should.have.length(3);
      }, done);
    });

    it('should limit returned fields', function (done) {
      list('/users?fields[]=email&fields[]=firstName', function validate(res) {
        res.body.total.should.equal(6);
        res.body.data.should.eql([
          {email: 'smith@example.com', firstName: 'Phil'},
          {email: 'jay.doe@example.com', firstName: 'Jay'},
          {email: 'jill.doe@example.com', firstName: 'Jill'},
          {email: 'jack.doe@example.com', firstName: 'Jack'},
          {email: 'jane.doe@example.com', firstName: 'Jane'},
          {email: 'john.doe@example.com', firstName: 'John'},
        ]);
      }, done);
    });

    it('should order by requested field', function (done) {
      list('/users?orderBy[]=age+asc', function validate(res) {
        res.body.total.should.equal(6);
        res.body.data.should.have.length(6);
        res.body.data.map(x => x.age).should.eql([18, 21, 24, 27, 54, 62]);
      }, done);
    });

    it('should page correctly', function (done) {
      list('/users?orderBy[]=age+desc&limit=3&offset=2', function validate(res) {
        res.body.total.should.equal(6);
        res.body.data.should.have.length(3);
        res.body.data.map(x => x.age).should.eql([27, 24, 21]);
        res.body.limit.should.equal(3);
        res.body.offset.should.equal(2);
      }, done);
    });
  });

  context('queryIn=body', function () {
    steps.cleanAndSync(shared);
    steps.insertData(shared);

    it('should list matching equality records', function (done) {
      listPost({isAdmin: true}, function validate(res) {
        res.body.total.should.equal(2);
        res.body.data.should.have.length(2);
      }, done);
    });

    it('should list matching multi-equality records', function (done) {
      listPost({lastName: 'Doe', isAdmin: false}, function validate(res) {
        res.body.total.should.equal(3);
        res.body.data.should.have.length(3);
      }, done);
    });

    it('should list matching range records', function (done) {
      listPost({age: {$gte: 20, $lte: 30}}, function validate(res) {
        res.body.total.should.equal(3);
        res.body.data.should.have.length(3);
      }, done);
    });

    it('should limit returned fields', function (done) {
      listPost({fields: ['email', 'firstName']}, function validate(res) {
        res.body.total.should.equal(6);
        res.body.data.should.eql([
          {email: 'smith@example.com', firstName: 'Phil'},
          {email: 'jay.doe@example.com', firstName: 'Jay'},
          {email: 'jill.doe@example.com', firstName: 'Jill'},
          {email: 'jack.doe@example.com', firstName: 'Jack'},
          {email: 'jane.doe@example.com', firstName: 'Jane'},
          {email: 'john.doe@example.com', firstName: 'John'},
        ]);
      }, done);
    });

    it('should order by requested field', function (done) {
      listPost({orderBy: ['age asc']}, function validate(res) {
        res.body.total.should.equal(6);
        res.body.data.should.have.length(6);
        res.body.data.map(x => x.age).should.eql([18, 21, 24, 27, 54, 62]);
      }, done);
    });

    it('should page correctly', function (done) {
      listPost({orderBy: ['age desc'], limit: 3, offset: 2}, function validate(res) {
        res.body.total.should.equal(6);
        res.body.data.should.have.length(3);
        res.body.data.map(x => x.age).should.eql([27, 24, 21]);
        res.body.limit.should.equal(3);
        res.body.offset.should.equal(2);
      }, done);
    });
  });
});
