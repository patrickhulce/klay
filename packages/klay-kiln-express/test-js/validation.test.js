const _ = require('lodash')
const klay = require('klay-core')

defineTest('validation.js', validationFactory => {
  let extension, model, modelDef, bake, next, sandbox
  let resApi = {status: _.noop, json: _.noop}

  beforeEach(() => {
    extension = validationFactory()
    model = klay.builders.object({
      name: klay.builders.string(),
      value: klay.builders.integer(),
    }).strict()

    modelDef = {model}
    sandbox = createSandbox()
    next = sandbox.stub()
    bake = function (options) {
      return extension.bake(modelDef, options)
    }
  })

  afterEach(() => {
    sandbox.reset()
  })

  describe('#bake', () => {
    it('should create a middleware function', () => {
      bake().should.be.a('function')
    })

    it('should add the location of the expected object in the request', () => {
      bake().should.have.property('in', 'body')
    })

    it('should add the model to the middleware', () => {
      const middleware = bake()
      middleware.should.have.property('model')

      const result = middleware.model.validate({value: '12415'})
      result.should.have.property('conforms', true)
      result.should.have.deep.property('value.value', 12415)
    })

    context('successful validation', () => {
      it('should validate the object', () => {
        const middleware = bake({in: 'query', allowedAsList: true})
        const req = {
          query: {value: '9', name: ''},
          body: {what: '?'},
        }

        middleware(req, resApi, next)
        next.should.have.been.called
        req.should.have.property('validated').eql({
          query: {value: 9, name: ''},
        })
      })

      it('should validate the object as list', () => {
        const middleware = bake({allowedAsList: true})
        const req = {body: [{value: '9', name: ''}]}

        middleware(req, resApi, next)
        next.should.have.been.called
        req.should.have.property('validated').eql({
          body: [{value: 9, name: ''}],
        })
      })
    })

    context('failed validation', () => {
      let json, status, req, middleware

      beforeEach(() => {
        req = {body: {what: '?'}}
        middleware = bake()
        resApi = {status: _.noop, json: _.noop}
        json = sandbox.stub(resApi, 'json')
        status = sandbox.stub(resApi, 'status')
      })

      it('should error when fails object validation', () => {
        middleware(req, resApi, next)
        next.should.not.have.been.called
      })

      it('should error when fails array validation', () => {
        middleware({body: [{value: 1}]}, resApi, next)
        next.should.not.have.been.called
      })

      it('should error when fails array element validation', () => {
        bake({allowedAsList: true})({body: [{value: 1}, {other: 0}]}, resApi, next)
        next.should.not.have.been.called
      })

      it('should error when fails with transform', () => {
        const newModel = klay.builders.string()
        const transform = sandbox.stub()
        transform.returns(newModel)
        middleware = bake({transform})
        middleware({body: {name: 'hi', value: 1}}, resApi, next)
        transform.should.have.been.called
        next.should.not.have.been.called
      })

      it('should error when fails with omit', () => {
        middleware = bake({omit: ['value']})
        middleware({body: {name: 'hi', value: 1}}, resApi, next)
        next.should.not.have.been.called
      })

      it('should error when fails with pick', () => {
        middleware = bake({pick: ['value']})
        middleware({body: {name: 'hi', value: 1}}, resApi, next)
        next.should.not.have.been.called
      })

      it('should handle an error', () => {
        middleware(req, resApi, next)
        json.should.have.been.called
        status.should.have.been.calledWith(400)
        json.firstCall.args[0].should.have.property('conforms', false)
      })

      it('should call status with appropriate status', () => {
        bake({status: 422})(req, resApi, next)
        status.should.have.been.calledWith(422)
      })

      it('should call json with toResponse', () => {
        const response = {foo: 'bar'}
        const toResponse = sandbox.stub().returns(response)
        bake({toResponse})(req, resApi, next)
        toResponse.should.have.been.called
        toResponse.firstCall.args[0].should.have.property('conforms', false)
        json.should.have.been.calledWith(response)
      })

      it('should call handleError', () => {
        const toResponse = sandbox.stub()
        const handleError = sandbox.stub()
        const options = {toResponse, handleError}
        bake(options)(req, resApi, next)
        status.should.not.have.been.called
        json.should.not.have.been.called
        toResponse.should.not.have.been.called
        handleError.should.have.been.called

        const args = handleError.firstCall.args
        args.should.have.deep.property('0.conforms', false)
        args.should.have.property('1', req)
        args.should.have.property('2', resApi)
        args.should.have.property('3', next)
        args.should.have.property('4', options)
      })
    })
  })
})
