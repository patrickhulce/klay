const ModelContext = require('klay-core').ModelContext
const createRoute = require('../../lib/helpers/create-route').createRoute

describe('lib/helpers/create-route.ts', () => {
  let context

  beforeEach(() => {
    context = new ModelContext()
  })

  it('should return the middleware function', () => {
    const handler = jest.fn().mockReturnValue(1)
    const route = createRoute({handler})
    expect(route.middleware[0]({}, {}, jest.fn())).toEqual(1)
  })

  it('should catch async errors from handler', async () => {
    const err = new Error('Oops')
    const handler = jest.fn().mockRejectedValue(err)
    const next = jest.fn()
    const route = createRoute({handler})
    try {
      await route.middleware[0]({}, {}, next)
    } catch (err) {
      // noop, expect it to throw
    } finally {
      expect(next).toHaveBeenCalledWith(err)
    }
  })

  it('should add extra middleware', () => {
    const handler = jest.fn()
    const extra = jest.fn()
    const middleware = {preValidation: extra}
    const route = createRoute({handler, middleware})
    expect(route.middleware[0]).toEqual(extra)
    expect(typeof route.middleware[1]).toEqual('function')
  })

  it('should add extra middleware as array', () => {
    const handler = jest.fn()
    const extraA = jest.fn()
    const extraB = jest.fn()
    const middleware = {postResponse: [extraA, extraB]}
    const route = createRoute({handler, middleware})
    expect(route.middleware[1]).toEqual(extraA)
    expect(route.middleware[2]).toEqual(extraB)
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
