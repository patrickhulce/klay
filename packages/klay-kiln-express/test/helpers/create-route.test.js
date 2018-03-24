const sinon = require('sinon')
const ModelContext = require('klay-core').ModelContext
const createRoute = require('../../dist/helpers/create-route').createRoute

describe('lib/helpers/create-route.ts', () => {
  let context

  beforeEach(() => {
    context = new ModelContext()
  })

  it('should return the middleware function', () => {
    const handler = sinon.stub()
    const route = createRoute({handler})
    expect(route).toMatchObject({middleware: [handler]})
  })

  it('should add extra middleware', () => {
    const handler = sinon.stub()
    const extra = sinon.stub()
    const middleware = {preValidation: extra}
    const route = createRoute({handler, middleware})
    expect(route).toMatchObject({middleware: [extra, handler]})
  })

  it('should add extra middleware as array', () => {
    const handler = sinon.stub()
    const extraA = sinon.stub()
    const extraB = sinon.stub()
    const middleware = {postResponse: [extraA, extraB]}
    const route = createRoute({handler, middleware})
    expect(route).toMatchObject({middleware: [handler, extraA, extraB]})
  })

  it('should add paramHandlers', () => {
    const handler = sinon.stub()
    const paramsModel = context.object().children({id: context.integer(), other: context.boolean()})
    const route = createRoute({handler, paramsModel})
    expect(route).toMatchObject({paramsModel})
    const nextStub = sinon.stub()
    route.paramHandlers.id(null, null, nextStub, '10')
    expect(nextStub.firstCall.args).toEqual([])
    route.paramHandlers.id(null, null, nextStub, '1.2')
    expect(nextStub.secondCall.args).toEqual(['route'])
    route.paramHandlers.other(null, null, nextStub, 'true')
    expect(nextStub.thirdCall.args).toEqual([])
    route.paramHandlers.other(null, null, nextStub, 'foobar')
    expect(nextStub.getCall(3).args).toEqual(['route'])
  })

  it('should create validation middleware', () => {
    const handler = sinon.stub()
    const queryModel = context.object().children({force: context.boolean()})
    const bodyModel = context.integer()
    const route = createRoute({queryModel, bodyModel, handler})
    expect(route).toMatchObject({queryModel, bodyModel})
    expect(route.middleware).toHaveLength(3)
  })
})
