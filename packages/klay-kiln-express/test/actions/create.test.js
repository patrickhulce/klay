var _ = require('lodash');
var request = require('supertest');
var steps = require('./steps');

function addRoutes(kiln, app) {
  var result = kiln.bake('user', 'express-router', {
    routes: {
      'POST /users': {action: 'create', validation: {body: {allowedAsList: true}}},
    },
  });

  app.use(result.router);
}

describedb('actions/create.js', function () {
  var shared = steps.init(addRoutes);

  var record = _.assign({metadata: {foo: 'bar'}}, fixtures.data.users[0]);
  var records = fixtures.data.users.slice(1, 3);
  var recordsB = fixtures.data.users.slice(3);

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

    it('should create multiple records', function (done) {
      post(records, function (res) {
        res.status.should.equal(200);

        res.body.should.have.length(2);
        res.body.forEach(function (item) {
          item.should.have.property('id');
          item.should.have.property('createdAt');
          item.should.have.property('updatedAt');
        });
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

    it('should validate a list of records', function (done) {
      post(recordsB.concat([{foo: 'what'}]), function (res) {
        res.status.should.equal(400);
      }, done);
    });

    it('should prevent duplicates in a list', function (done) {
      post(recordsB.concat(record), function (res) {
        res.status.should.equal(500);
        res.body.message.should.match(/constraint.*violated/);
      }, done);
    });
  });
});
