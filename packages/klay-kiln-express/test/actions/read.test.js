var _ = require('lodash');
var request = require('supertest');
var steps = require('./steps');

function addRoutes(kiln, app) {
  var result = kiln.bake('user', 'express-router', {
    routes: {
      'POST /users': 'create',
      'GET /users/:id': 'read',
    },
  });

  app.use(result.router);
}

describedb('actions/read.js', function () {
  var shared = steps.init(addRoutes);

  var recordA = _.assign({metadata: {foo: 'bar'}}, fixtures.data.users[0]);
  var recordB = fixtures.data.users[1];

  var post = function (data, func, done) {
    return request(shared.app).
      post('/users').
      type('json').
      send(data).
      expect(func).
      end(done);
  };

  var get = function (id, func, done) {
    return request(shared.app).
      get('/users/' + id).
      expect(func).
      end(done);
  };

  it('should create a record', function (done) {
    post(recordA, res => shared.userA = res.body, done);
  });

  it('should create a 2nd record', function (done) {
    post(recordB, res => shared.userB = res.body, done);
  });

  it('should read a record', function (done) {
    get(shared.userA.id, function (res) {
      res.status.should.equal(200);
      res.body.should.eql(shared.userA);
    }, done);
  });

  it('should read another record', function (done) {
    get(shared.userB.id, function (res) {
      res.status.should.equal(200);
      res.body.should.eql(shared.userB);
    }, done);
  });

  it('should validate the id', function (done) {
    get('foobar', function (res) {
      res.status.should.equal(400);
    }, done);
  });

  it('should not read a missing record', function (done) {
    get(20151, function (res) {
      res.status.should.equal(500);
      res.body.message.should.match(/no such record.*20151/);
    }, done);
  });
});
