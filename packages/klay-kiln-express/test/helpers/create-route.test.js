const expect = require('chai').expect
const sinon = require('sinon')
const ModelContext = require('klay').ModelContext
const createRoute = require('../../dist/helpers/create-route').createRoute

describe('lib/helpers/create-route.ts', () => {
  let context

  beforeEach(() => {
    context = new ModelContext()
  })

  it('should return the middleware function', () => {
    const handler = sinon.stub()
    const route = createRoute({handler})
    expect(route).to.eql({middleware: [handler]})
  })

  it('should add extra middleware', () => {
    const handler = sinon.stub()
    const extra = sinon.stub()
    const middleware = {preValidation: extra}
    const route = createRoute({handler, middleware})
    expect(route).to.eql({middleware: [extra, handler]})
  })

  it('should add extra middleware as array', () => {
    const handler = sinon.stub()
    const extraA = sinon.stub()
    const extraB = sinon.stub()
    const middleware = {postResponse: [extraA, extraB]}
    const route = createRoute({handler, middleware})
    expect(route).to.eql({middleware: [handler, extraA, extraB]})
  })

  it('should create validation middleware', () => {
    const handler = sinon.stub()
    const queryModel = context.object().children({force: context.boolean()})
    const bodyModel = context.integer()
    const route = createRoute({queryModel, bodyModel, handler})
    expect(route).to.include({queryModel, bodyModel})
    expect(route.middleware).to.have.length(3)
  })
})
