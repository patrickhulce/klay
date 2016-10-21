var _ = require('lodash');
var klay = require('klay');

defineTest('validation.js', function (validationFactory) {
  var extension, model, modelDef, bake, next, sandbox;
  var resApi = {status: _.noop, json: _.noop};

  beforeEach(function () {
    extension = validationFactory();
    model = klay.builders.object({
      name: klay.builders.string(),
      value: klay.builders.integer(),
    }).strict();

    modelDef = {model};
    sandbox = createSandbox();
    next = sandbox.stub();
    bake = function (options) {
      return extension.bake(modelDef, options);
    };
  });

  afterEach(function () {
    sandbox.reset();
  });

  describe('#bake', function () {
    it('should create a middleware function', function () {
      bake().should.be.a('function');
    });

    it('should add the location of the expected object in the request', function () {
      bake().should.have.property('in', 'body');
    });

    it('should add the model to the middleware', function () {
      var middleware = bake();
      middleware.should.have.property('model');

      var result = middleware.model.validate({value: '12415'});
      result.should.have.property('conforms', true);
      result.should.have.deep.property('value.value', 12415);
    });

    context('successful validation', function () {
      it('should validate the object', function () {
        var middleware = bake({in: 'query', allowedAsList: true});
        var req = {
          query: {value: '9', name: ''},
          body: {what: '?'},
        };

        middleware(req, resApi, next);
        next.should.have.been.called;
        req.should.have.property('validated').eql({
          query: {value: 9, name: ''},
        });
      });

      it('should validate the object as list', function () {
        var middleware = bake({allowedAsList: true});
        var req = {body: [{value: '9', name: ''}]};

        middleware(req, resApi, next);
        next.should.have.been.called;
        req.should.have.property('validated').eql({
          body: [{value: 9, name: ''}],
        });
      });
    });

    context('failed validation', function () {
      var json, status, req, middleware;

      beforeEach(function () {
        req = {body: {what: '?'}};
        middleware = bake();
        resApi = {status: _.noop, json: _.noop};
        json = sandbox.stub(resApi, 'json');
        status = sandbox.stub(resApi, 'status');
      });

      it('should error when fails object validation', function () {
        middleware(req, resApi, next);
        next.should.not.have.been.called;
      });

      it('should error when fails array validation', function () {
        middleware({body: [{value: 1}]}, resApi, next);
        next.should.not.have.been.called;
      });

      it('should error when fails array element validation', function () {
        bake({allowedAsList: true})({body: [{value: 1}, {other: 0}]}, resApi, next);
        next.should.not.have.been.called;
      });

      it('should handle an error', function () {
        middleware(req, resApi, next);
        json.should.have.been.called;
        status.should.have.been.calledWith(400);
        json.firstCall.args[0].should.have.property('conforms', false);
      });

      it('should call status with appropriate status', function () {
        bake({status: 422})(req, resApi, next);
        status.should.have.been.calledWith(422);
      });

      it('should call json with toResponse', function () {
        var response = {foo: 'bar'};
        var toResponse = sandbox.stub().returns(response);
        bake({toResponse})(req, resApi, next);
        toResponse.should.have.been.called;
        toResponse.firstCall.args[0].should.have.property('conforms', false);
        json.should.have.been.calledWith(response);
      });

      it('should call handleError', function () {
        var toResponse = sandbox.stub();
        var handleError = sandbox.stub();
        var options = {toResponse, handleError};
        bake(options)(req, resApi, next);
        status.should.not.have.been.called;
        json.should.not.have.been.called;
        toResponse.should.not.have.been.called;
        handleError.should.have.been.called;

        var args = handleError.firstCall.args;
        args.should.have.deep.property('0.conforms', false);
        args.should.have.property('1', req);
        args.should.have.property('2', resApi);
        args.should.have.property('3', next);
        args.should.have.property('4', options);
      });
    });
  });
});
