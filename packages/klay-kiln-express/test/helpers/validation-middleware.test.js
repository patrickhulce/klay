const expect = require('chai').expect
const sinon = require('sinon')
const ModelContext = require('klay').ModelContext
const createMiddleware = require('../../dist/helpers/validation-middleware')
  .createValidationMiddleware

describe('lib/helpers/validation-middleware.ts', () => {
  let context, model, next

  beforeEach(() => {
    context = new ModelContext()
    model = context.object().children({id: context.integer()})
    next = sinon.stub()
  })

  it('should create a function', () => {
    const middleware = createMiddleware(model)
    expect(middleware).to.be.a('function')
  })

  it('should set validated', () => {
    const middleware = createMiddleware(model)
    const req = {body: {id: '1'}}
    middleware(req, {}, next)
    expect(req.validated).to.eql({body: {id: 1}})
    expect(req.body).to.eql({id: '1'})
    expect(next.callCount).to.equal(1)
  })

  it('should merge validated', () => {
    const middleware = createMiddleware(model, 'query')
    const req = {body: {id: '1'}, validated: {params: 1}}
    middleware(req, {}, next)
    expect(req.validated).to.eql({params: 1, query: undefined})
    expect(req.body).to.eql({id: '1'})
  })

  it('should validate against model', () => {
    const middleware = createMiddleware(model)
    const req = {body: {id: 'one'}}
    const res = {
      json: sinon.stub(),
      status: sinon.stub(),
    }

    middleware(req, res, next)
    expect(next.callCount).to.equal(0)
    expect(res.status.callCount).to.equal(1)
    expect(res.json.callCount).to.equal(1)
    expect(res.json.firstCall.args[0]).to.eql({
      conforms: false,
      value: {id: 'one'},
      errors: [{path: ['id'], message: 'expected value (one) to have typeof number'}],
    })
  })
})
