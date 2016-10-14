var _ = require('lodash');
var request = require('supertest');
var steps = require('./steps');

function addRoutes(kiln, app) {
  var result = kiln.bake('user', 'express-router', {
    routes: {
      'GET /users': 'list',
      'DELETE /users': {byId: false, range: true, action: 'destroy'},
      'DELETE /users/:id': {byId: true, action: 'destroy'},
    },
  });

  app.use(result.router);
}

describedb('actions/destroy.js', function () {
  var shared = steps.init(addRoutes);

  context('byId', function () {
    steps.cleanAndSync(shared);
    steps.insertData(shared);

    it('should destroy a single record', function (done) {
      request(shared.app).
        delete('/users/1').
        expect(validate).
        end(done);

      function validate(res) {
        res.status.should.equal(200);
      }
    });

    it('should no longer appear in results', function (done) {
      request(shared.app).
        get('/users').
        expect(validate).
        end(done);

      function validate(res) {
        res.status.should.equal(200);
        res.body.should.have.property('total', 5);
      }
    });
  });

  context('queryIn=query', function () {
    steps.cleanAndSync(shared);
    steps.insertData(shared);

    it('should destroy equality records', function (done) {
      request(shared.app).
        delete('/users?isAdmin=true').
        expect(validate).
        end(done);

      function validate(res) {
        res.status.should.equal(200);
      }
    });

    it('should no longer appear in results', function (done) {
      request(shared.app).
        get('/users').
        expect(validate).
        end(done);

      function validate(res) {
        res.status.should.equal(200);
        res.body.should.have.property('total', 4);
      }
    });

    it('should destroy range records with limit', function (done) {
      request(shared.app).
        delete('/users?age[$gte]=20&limit=2').
        expect(validate).
        end(done);

      function validate(res) {
        res.status.should.equal(200);
      }
    });

    it('should no longer appear in results', function (done) {
      request(shared.app).
        get('/users').
        expect(validate).
        end(done);

      function validate(res) {
        res.status.should.equal(200);
        res.body.should.have.property('total', 2);
      }
    });
  });

  context('queryIn=body', function () {
    steps.cleanAndSync(shared);
    steps.insertData(shared);

    it('should destroy range records', function (done) {
      request(shared.app).
        delete('/users').
        send({age: {$gte: 20, $lte: 30}}).type('json').
        expect(validate).
        end(done);

      function validate(res) {
        res.status.should.equal(200);
      }
    });

    it('should no longer appear in results', function (done) {
      request(shared.app).
        get('/users').
        expect(validate).
        end(done);

      function validate(res) {
        res.status.should.equal(200);
        res.body.should.have.property('total', 3);
      }
    });

    it('should destroy equality records with limit', function (done) {
      request(shared.app).
        delete('/users').
        send({isAdmin: true, limit: 1}).type('json').
        expect(validate).
        end(done);

      function validate(res) {
        res.status.should.equal(200);
      }
    });

    it('should no longer appear in results', function (done) {
      request(shared.app).
        get('/users').
        expect(validate).
        end(done);

      function validate(res) {
        res.status.should.equal(200);
        res.body.should.have.property('total', 2);
      }
    });
  });
});
