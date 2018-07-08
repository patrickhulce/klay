const uuid = require('uuid').v4

const utils = require('../utils')

describe('lib/actions/patch.ts', () => {
  let state, executor, findStub, updateStub
  const buildRoute = opts => utils.createRoute(opts, state)

  beforeEach(() => {
    state = utils.state()

    executor = state.executor
    findStub = jest.spyOn(executor, 'findByIdOrThrow').mockReturnValue({lastName: 'Thompson'})
    updateStub = jest.spyOn(executor, 'update').mockImplementation(x => x)
  })

  it('should build the route', () => {
    const route = utils.createRoute({type: 'patch', patchProperties: ['firstName']}, state)
    expect(route.bodyModel).toHaveProperty('isKlayModel', true)
    expect(route.middleware.length).toBeGreaterThan(0)
  })

  it('should throw if properties not set', () => {
    const fn = () => utils.createRoute({type: 'patch'}, state)
    expect(fn).toThrowError(/Cannot patch/)
  })

  it('should call update', async () => {
    const route = utils.createRoute({type: 'patch', patchProperties: ['firstName']}, state)
    const id = uuid()
    const payload = {firstName: 'Mychel'}

    const req = {params: {id}, body: payload}
    const {res, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(req).toHaveProperty('validated.body')
    expect(req).toHaveProperty('validated.body.firstName', 'Mychel')
    expect(req).toHaveProperty('actionTarget', {lastName: 'Thompson'})
    expect(await res.promise).toEqual({firstName: 'Mychel', lastName: 'Thompson'})
    expect(nextCalledAll).toBe(true)
    expect(updateStub).toHaveBeenCalledTimes(1)
  })

  it('should validate params', async () => {
    const route = utils.createRoute({type: 'patch', patchProperties: ['firstName']}, state)
    const req = {params: {id: 'foo'}, body: {firstName: 'bar'}}
    const {res, next, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error)
    expect(next.mock.calls[0][0].value).toMatchObject({id: 'foo'})
    expect(res.promise).toBe(undefined)
    expect(nextCalledAll).toBe(false)
    expect(updateStub).toHaveBeenCalledTimes(0)
  })

  it('should validate body', async () => {
    const route = utils.createRoute({type: 'patch', patchProperties: ['firstName']}, state)
    const req = {params: {id: uuid()}, body: {lastName: 'Other'}}
    const {res, next, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(next.mock.calls[1][0]).toBeInstanceOf(Error)
    expect(next.mock.calls[1][0].value).toEqual({lastName: 'Other'})
    expect(res.promise).toBe(undefined)
    expect(nextCalledAll).toBe(false)
    expect(updateStub).toHaveBeenCalledTimes(0)
  })

  describe('authorization', () => {
    let authorization, grants

    beforeEach(() => {
      authorization = {permission: 'users:admin'}
      grants = new utils.Grants(['user'], {id: 'unused', lastName: 'Thompson'}, utils.auth)
    })

    it('should pass authorization', async () => {
      const route = buildRoute({type: 'patch', patchProperties: ['firstName'], authorization})
      const req = {grants, params: {id: uuid()}, body: {firstName: 'John'}}
      const {res} = await utils.runMiddleware(route.middleware, req)

      expect(await res.promise).toEqual({firstName: 'John', lastName: 'Thompson'})
      expect(updateStub).toHaveBeenCalledTimes(1)
    })

    it('should fail authorization for incoming', async () => {
      const route = buildRoute({type: 'patch', patchProperties: ['lastName'], authorization})
      const body = {lastName: 'Mychel'}
      const req = {grants, params: {id: uuid()}, body}
      const {res, err} = await utils.runMiddleware(route.middleware, req)

      expect(err).toBeInstanceOf(Error)
      expect(err.message).toMatch(/permission/)
      expect(res.promise).toBe(undefined)
    })

    it('should fail authorization for existing', async () => {
      findStub.mockReset()
      findStub.mockReturnValue({lastName: 'Foo'})

      const route = buildRoute({type: 'patch', patchProperties: ['firstName'], authorization})
      const body = {firstName: 'Mychel'}
      const req = {grants, params: {id: uuid()}, body}
      const {res, err} = await utils.runMiddleware(route.middleware, req)

      expect(err).toBeInstanceOf(Error)
      expect(err.message).toMatch(/permission/)
      expect(res.promise).toBe(undefined)
    })
  })
})
