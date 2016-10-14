var _ = require('lodash');
var request = require('supertest');
var steps = require('./steps');

function addRoutes(kiln, app) {
  var result = kiln.bake('user', 'express-router', {
    routes: {
      'POST /users': 'create',
      'PUT /users/:id': 'update',
    },
  });

  app.use(result.router);
}

describedb('routes/update.js', function () {
  var shared = steps.init(addRoutes);

  var recordA = _.assign({metadata: {foo: 'bar'}}, fixtures.data.users[0]);
  var recordB = _.assign({metadata: null}, fixtures.data.users[1]);

  var post = function (data, func, done) {
    return request(shared.app).
      post('/users').
      type('json').
      send(data).
      expect(func).
      end(done);
  };

  var put = function (data, func, done, id) {
    return request(shared.app).
      put('/users/' + (id || data.id)).
      type('json').
      send(data).
      expect(func).
      end(done);
  };

  it('should create a record', function (done) {
    post(recordA, res => shared.userA = res.body, done);
  });

  it('should create a 2nd record', function (done) {
    post(recordB, res => shared.userB = res.body, done);
  });

  context('failure', function () {
    it('should validate an incomplete record', function (done) {
      put(_.omit(shared.userA, ['age']), function (res) {
        res.status.should.equal(400);
      }, done);
    });

    it('should validate a missing record', function (done) {
      put(_.assign({}, shared.userA, {id: 2012}), function (res) {
        res.status.should.equal(500);
        res.body.message.should.match(/no such object/);
      }, done);
    });

    it('should validate a mismatched record', function (done) {
      put(shared.userA, function (res) {
        res.status.should.equal(500);
        res.body.message.should.match(/no such object/);
      }, done, 12512);
    });

    it('should validate an immutable record', function (done) {
      put(_.assign({}, shared.userA, {createdAt: new Date()}), function (res) {
        res.status.should.equal(500);
        res.body.message.should.match(/constraint.*violated/);
      }, done);
    });
  });

  context('success', function () {
    it('should update a record', function (done) {
      put(_.assign({}, shared.userA, {isAdmin: false, age: 100}), function (res) {
        res.status.should.equal(200);

        var user = res.body;
        user.should.have.property('age', 100);
        user.should.have.property('isAdmin', false);
        user.should.have.property('updatedAt').greaterThan(shared.userA.updatedAt);

        var toOmit = ['age', 'isAdmin', 'updatedAt'];
        _.omit(user, toOmit).should.eql(_.omit(shared.userA, toOmit));
      }, done);
    });
  });
});
