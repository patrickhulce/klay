
const ModelContext = require('klay-core').ModelContext
const createRoute = require('../../dist/helpers/create-route').createRoute

describe('lib/helpers/create-route.ts', () => {
  let context

  beforeEach(() => {
    context = new ModelContext()
  })

  it('should return the middleware function', () => {
    const handler = jest.fn()
    const route = createRoute({handler})
    expect(route).toMatchObject({middleware: [handler]})
  })

  it('should add extra middleware', () => {
    const handler = jest.fn()
    const extra = jest.fn()
    const middleware = {preValidation: extra}
    const route = createRoute({handler, middleware})
    expect(route).toMatchObject({middleware: [extra, handler]})
  })

  it('should add extra middleware as array', () => {
    const handler = jest.fn()
    const extraA = jest.fn()
    const extraB = jest.fn()
    const middleware = {postResponse: [extraA, extraB]}
    const route = createRoute({handler, middleware})
    expect(route).toMatchObject({middleware: [handler, extraA, extraB]})
  })

  it('should add paramHandlers', () => {
    const handler = jest.fn()
    const paramsModel = context.object().children({id: context.integer(), other: context.boolean()})
    const route = createRoute({handler, paramsModel})
    expect(route).toMatchObject({paramsModel})
    const nextStub = jest.fn()
    route.paramHandlers.id(null, null, nextStub, '10')
    expect(nextStub.mock.calls[0]).toEqual([])
    route.paramHandlers.id(null, null, nextStub, '1.2')
    expect(nextStub.mock.calls[1]).toEqual(['route'])
    route.paramHandlers.other(null, null, nextStub, 'true')
    expect(nextStub.mock.calls[2]).toEqual([])
    route.paramHandlers.other(null, null, nextStub, 'foobar')
    expect(nextStub.mock.calls[3]).toEqual(['route'])
  })

  it('should create validation middleware', () => {
    const handler = jest.fn()
    const queryModel = context.object().children({force: context.boolean()})
    const bodyModel = context.integer()
    const route = createRoute({queryModel, bodyModel, handler})
    expect(route).toMatchObject({queryModel, bodyModel})
    expect(route.middleware).toHaveLength(3)
  })
})
