var _ = require('lodash');
var klay = require('klay');
var request = require('supertest');
var steps = require('./steps');

function addRoutes(kiln, app) {
  var result = kiln.bake('user', 'express-router', {
    routes: {
      'GET /:foo/:bar': {
        queryModel: function () {
          return klay.builders.object({
            optionA: klay.builders.boolean(),
          });
        },
        paramsModel: function () {
          return klay.builders.object({
            foo: klay.builders.string(),
            bar: klay.builders.integer(),
          });
        },
        handler: function (modelDef) {
          return function (req, res) {
            res.json({
              hello: 'custom',
              params: req.validated.params,
              query: req.validated.query,
            });
          };
        },
      },
    },
  });

  app.use(result.router);
}

describedb('actions/custom', function () {
  var shared = steps.init(addRoutes);

  var get = function (url, func, done) {
    return request(shared.app).
      get(url).
      expect(func).
      end(done);
  };

  it('should use handler', function (done) {
    get('/something/123', function (res) {
      res.status.should.equal(200);
      res.body.should.have.property('hello', 'custom');
    }, done);
  });

  it('should use paramsModel', function (done) {
    get('/something/foo', function (res) {
      res.status.should.equal(400);
    }, done);
  });

  it('should use queryModel', function (done) {
    get('/something/12?optionA=mist', function (res) {
      res.status.should.equal(400);
    }, done);
  });

  it('should combine all', function (done) {
    get('/something/123?optionA=true', function (res) {
      var query = {optionA: true};
      var params = {foo: 'something', bar: 123};
      res.body.should.eql({hello: 'custom', params, query});
    }, done);
  });
});
