var _ = require('lodash');
var request = require('supertest');
var steps = require('./steps');

function addCreateRoutes(kiln, app) {
  var result = kiln.bake('user', 'express-router', {
    routes: {
      'POST /users': 'create',
    },
  });

  app.use(result.router);
}

describedb('routes/create.js', function () {
  var shared = steps.init(addCreateRoutes);

  var record = _.assign({metadata: {foo: 'bar'}}, fixtures.data.users[0]);
  var recordB = _.assign({metadata: null}, fixtures.data.users[1]);

  var post = function (data, func, done) {
    return request(shared.app).
      post('/users').
      type('json').
      send(data).
      expect(func).
      end(done);
  };

  context('success', function () {
    it('should create a record', function (done) {
      post(record, function (res) {
        res.status.should.equal(200);

        var user = res.body;
        user.should.have.property('id');
        user.should.have.property('createdAt');
        user.should.have.property('updatedAt');

        _.omit(user, ['id', 'createdAt', 'updatedAt']).should.eql(record);
      }, done);
    });

    it('should create a second record', function (done) {
      post(recordB, function (res) {
        res.status.should.equal(200);

        var user = res.body;
        user.should.have.property('id');
        user.should.have.property('createdAt');
        user.should.have.property('updatedAt');

        _.omit(user, ['id', 'createdAt', 'updatedAt']).should.eql(recordB);
      }, done);
    });
  });

  context('failure', function () {
    it('should validate an incomplete record', function (done) {
      post(_.omit(record, ['age']), function (res) {
        res.status.should.equal(400);
      }, done);
    });

    it('should validate record with excess properties', function (done) {
      post(_.assign({id: 15}, record), function (res) {
        res.status.should.equal(400);
      }, done);
    });

    it('should prevent a duplicate record', function (done) {
      post(record, function (res) {
        res.status.should.equal(500);
        res.body.message.should.match(/constraint.*violated/);
      }, done);
    });
  });
});
