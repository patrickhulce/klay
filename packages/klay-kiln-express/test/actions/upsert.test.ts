const utils = require('../utils')

describe('lib/actions/upsert.ts', () => {
  let state, executor, upsertStub, upsertAllStub

  beforeEach(() => {
    state = utils.state()

    executor = state.executor
    jest.spyOn(executor, 'findOne').mockReturnValue(undefined)
    upsertStub = jest.spyOn(executor, 'upsert').mockImplementation(x => x)
    upsertAllStub = jest.spyOn(executor, 'upsertAll').mockImplementation(x => x)
  })

  it('should build the route', () => {
    const route = utils.createRoute({type: 'upsert'}, state)
    expect(route.bodyModel).toHaveProperty('isKlayModel', true)
    expect(route.middleware.length).toBeGreaterThan(0)
  })

  it('should call upsert', async () => {
    const route = utils.createRoute({type: 'upsert'}, state)
    const req = {body: {...utils.defaultUser}}
    const {res, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(req).toHaveProperty('validated.body')
    expect(req).not.toHaveProperty('validated.body.id')
    expect(await res.promise).toEqual(req.validated.body)
    expect(nextCalledAll).toBe(true)
    expect(upsertStub).toHaveBeenCalledTimes(1)
  })

  it('should call upsertAll', async () => {
    const route = utils.createRoute({type: 'upsert', byList: true}, state)
    const req = {body: [{...utils.defaultUser}]}
    const {res, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(req).toHaveProperty('validated.body.0.firstName')
    expect(req).not.toHaveProperty('validated.body.0.id')
    expect(await res.promise).toEqual(req.validated.body)
    expect(nextCalledAll).toBe(true)
    expect(upsertStub).toHaveBeenCalledTimes(0)
    expect(upsertAllStub).toHaveBeenCalledTimes(1)
  })

  it('should validate body', async () => {
    const route = utils.createRoute({type: 'upsert'}, state)
    const req = {body: {...utils.defaultUser, age: false}}
    const {res, next, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error)
    expect(next.mock.calls[0][0].value).toMatchObject({age: false})
    expect(res.promise).toBe(undefined)
    expect(nextCalledAll).toBe(false)
    expect(upsertStub).toHaveBeenCalledTimes(0)
  })
})
