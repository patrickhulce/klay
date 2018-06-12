const uuid = require('uuid').v4

const utils = require('../utils')

describe('lib/actions/read.ts', () => {
  let state, executor, readStub

  beforeEach(() => {
    state = utils.state()

    executor = state.executor
    readStub = jest.spyOn(executor, 'findByIdOrThrow').mockReturnValue({foo: 'bar'})
  })

  it('should build the route', () => {
    const route = utils.createRoute({type: 'read'}, state)
    expect(route.paramsModel).toHaveProperty('isKlayModel', true)
    expect(route.middleware.length).toBeGreaterThan(0)
  })

  it('should call read', async () => {
    const route = utils.createRoute({type: 'read'}, state)
    const id = uuid()
    const req = {params: {id}}
    const {res, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(req).toHaveProperty('validated.params.id', id)
    expect(req).toHaveProperty('actionTarget', {foo: 'bar'})
    expect(await res.promise).toEqual({foo: 'bar'})
    expect(nextCalledAll).toBe(true)
    expect(readStub).toHaveBeenCalledTimes(1)
  })

  it('should validate params', async () => {
    const route = utils.createRoute({type: 'read'}, state)
    const req = {params: {id: 'foo'}}
    const {res, next, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error)
    expect(next.mock.calls[0][0].value).toMatchObject({id: 'foo'})
    expect(res.promise).toBe(undefined)
    expect(nextCalledAll).toBe(false)
    expect(readStub).toHaveBeenCalledTimes(0)
  })

  describe('authorization', () => {
    let authorization, grants

    beforeEach(() => {
      authorization = {permission: 'users:admin'}
      grants = new utils.Grants(['user'], {id: 1, lastName: 'Thompson'}, utils.auth)
    })

    it('should pass authorization', async () => {
      const route = utils.createRoute({type: 'read', authorization}, state)
      const req = {grants, params: {id: uuid()}}
      const {res} = await utils.runMiddleware(route.middleware, req)

      expect(await res.promise).toEqual(req.validated.body)
      expect(readStub).toHaveBeenCalledTimes(1)
    })

    it('should fail authorization', async () => {
      const route = utils.createRoute({type: 'read', authorization}, state)
      const req = {grants, params: {id: uuid()}}
      readStub.mockReturnValue({lastName: 'Not-Thompson'})
      const {res, err} = await utils.runMiddleware(route.middleware, req)

      expect(err).toBeInstanceOf(Error)
      expect(err.message).toMatch(/permission/)
      expect(res.promise).toBe(undefined)
    })
  })
})
