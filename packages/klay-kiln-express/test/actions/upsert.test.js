var _ = require('lodash');
var request = require('supertest');
var steps = require('./steps');

function addRoutes(kiln, app) {
  var result = kiln.bake('user', 'express-router', {
    routes: {
      'POST /users': {action: 'upsert', validation: {body: {allowedAsList: true}}},
    },
  });

  app.use(result.router);
}

describedb('actions/upsert.js', function () {
  var shared = steps.init(addRoutes);

  var recordA = _.defaults({metadata: null}, fixtures.data.users[0]);
  var recordsA = fixtures.data.users.slice(0, 3).map(o => _.defaults({metadata: null}, o));
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
      post(recordA, function (res) {
        res.status.should.equal(200);

        var user = shared.recordA = res.body;
        user.should.have.property('id');
        user.should.have.property('createdAt');
        user.should.have.property('updatedAt');

        _.omit(user, ['id', 'createdAt', 'updatedAt']).should.eql(recordA);
      }, done);
    });

    it('should update a record', function (done) {
      post(_.assign({}, recordA, {age: 100}), function (res) {
        res.status.should.equal(200);

        var user = res.body;
        user.should.have.property('age', 100);
        user.should.have.property('updatedAt').greaterThan(shared.recordA.updatedAt);

        _.omit(user, ['age', 'updatedAt']).should.eql(_.omit(shared.recordA, ['age', 'updatedAt']));
      }, done);
    });

    it('should create/update multiple records', function (done) {
      post(recordsA, function (res) {
        res.status.should.equal(200);

        res.body.should.have.length(3);
        res.body.forEach(function (item, index) {
          var expected = recordsA[index];
          item.should.have.property('id');
          var omitted = ['id', 'createdAt', 'updatedAt'];
          _.omit(item, omitted).should.eql(_.omit(expected, omitted));
        });
      }, done);
    });
  });

  context('failure', function () {
    it('should validate an incomplete record for create', function (done) {
      post(_.omit(recordA, ['age']), function (res) {
        res.status.should.equal(400);
      }, done);
    });

    it('should validate an incomplete record for update', function (done) {
      post(_.assign({}, recordA, {id: 2012}), function (res) {
        res.status.should.equal(400);
        res.body.should.deep.property('errors.0.message').match(/unexpected properties/);
      }, done);
    });

    it('should validate an incomplete record in list', function (done) {
      post(recordsA.concat({foobar: 'bam'}), function (res) {
        res.status.should.equal(400);
      }, done);
    });
  });
});
