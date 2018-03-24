const uuid = require('uuid').v4
const utils = require('../utils')

describe('lib/actions/destroy.ts', () => {
  let state, kiln, executor, findStub, destroyStub, transactionStub
  const buildRoute = opts => kiln.build('user', 'express-route', opts)

  beforeEach(() => {
    state = utils.state()
    kiln = state.kiln
    executor = state.executor
    findStub = jest.spyOn(executor, 'findByIdOrThrow').mockReturnValue({lastName: 'Thompson'})
    destroyStub = jest.spyOn(executor, 'destroyById').mockReturnValue(Promise.resolve())
    transactionStub = jest.spyOn(executor, 'transaction').mockImplementation(f => f('t'))
  })

  it('should build the byId route', () => {
    const route = buildRoute({type: 'destroy'})
    expect(route.paramsModel).toHaveProperty('isKlayModel', true)
    expect(route.bodyModel).toBe(undefined)
    expect(route.middleware.length).toBeGreaterThan(0)
  })

  it('should build the bulk route', () => {
    const route = buildRoute({type: 'destroy', byId: false})
    expect(route.paramsModel).toBe(undefined)
    expect(route.bodyModel).toHaveProperty('isKlayModel', true)
    expect(route.middleware.length).toBeGreaterThan(0)
  })

  it('should call destroy', async () => {
    const route = buildRoute({type: 'destroy'})
    const id = uuid()
    const req = {params: {id}}
    const {res, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(req).toHaveProperty('validated.params.id', id)
    expect(req).toHaveProperty('actionTarget', {lastName: 'Thompson'})
    expect(await res.promise).toEqual(undefined)
    expect(nextCalledAll).toBe(true)
    expect(destroyStub).toHaveBeenCalledTimes(1)
  })

  it('should call single destroy', async () => {
    const route = buildRoute({type: 'destroy', byId: false})
    const req = {body: uuid()}
    const {res, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(typeof req.validated.body).toBe('string')
    expect(req).toHaveProperty('actionTarget', {lastName: 'Thompson'})
    expect(await res.promise).toEqual(undefined)
    expect(nextCalledAll).toBe(true)
    expect(destroyStub).toHaveBeenCalledTimes(1)
    expect(transactionStub).toHaveBeenCalledTimes(0)
  })

  it('should call bulk destroy', async () => {
    const route = buildRoute({type: 'destroy', byId: false, byList: true})
    const req = {body: [uuid(), uuid(), uuid()]}
    const {res, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(req.validated.body).toHaveLength(3)
    expect(req).toHaveProperty('actionTarget', [
      {lastName: 'Thompson'},
      {lastName: 'Thompson'},
      {lastName: 'Thompson'},
    ])
    expect(await res.promise).toEqual(undefined)
    expect(nextCalledAll).toBe(true)
    expect(destroyStub).toHaveBeenCalledTimes(3)
    expect(transactionStub).toHaveBeenCalledTimes(1)
    expect(destroyStub.mock.calls[0][1]).toHaveProperty('transaction', 't')
  })

  it('should validate params', async () => {
    const route = buildRoute({type: 'destroy'})
    const req = {params: {id: 'foo'}}
    const {res, next, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error)
    expect(next.mock.calls[0][0].value).toMatchObject({id: 'foo'})
    expect(res.promise).toBe(undefined)
    expect(nextCalledAll).toBe(false)
    expect(destroyStub).toHaveBeenCalledTimes(0)
  })

  it('should validate single body', async () => {
    const route = buildRoute({type: 'destroy', byId: false})
    const req = {body: [uuid()]}
    const {res, next, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error)
    expect(next.mock.calls[0][0].value).toEqual(req.body)
    expect(res.promise).toBe(undefined)
    expect(nextCalledAll).toBe(false)
    expect(destroyStub).toHaveBeenCalledTimes(0)
  })

  it('should validate bulk body', async () => {
    const route = buildRoute({type: 'destroy', byId: false, byList: true})
    const req = {body: uuid()}
    const {res, next, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error)
    expect(next.mock.calls[0][0].value).toEqual(req.body)
    expect(res.promise).toBe(undefined)
    expect(nextCalledAll).toBe(false)
    expect(destroyStub).toHaveBeenCalledTimes(0)
  })

  describe('authorization', () => {
    let authorization, grants

    beforeEach(() => {
      authorization = {permission: 'users:admin', criteria: [['lastName']]}
      grants = new utils.Grants('user', {id: 1, lastName: 'Thompson'}, utils.auth)
    })

    it('should pass authorization', async () => {
      const route = buildRoute({type: 'destroy', authorization})
      const req = {grants, params: {id: uuid()}}
      const {res} = await utils.runMiddleware(route.middleware, req)

      expect(await res.promise).toEqual(req.validated.body)
      expect(destroyStub).toHaveBeenCalledTimes(1)
    })

    it('should fail authorization', async () => {
      const route = buildRoute({type: 'destroy', authorization})
      const req = {grants, params: {id: uuid()}}
      findStub.mockReturnValue({lastName: 'Not-Thompson'})
      const {res, err} = await utils.runMiddleware(route.middleware, req)

      expect(err).toBeInstanceOf(Error)
      expect(err.message).toMatch(/permission/)
      expect(res.promise).toBe(undefined)
    })

    it('should pass list authorization', async () => {
      const route = buildRoute({type: 'destroy', byId: false, byList: true, authorization})
      const body = [uuid(), uuid()]

      const req = {grants, body}
      await utils.runMiddleware(route.middleware, req)
      expect(destroyStub).toHaveBeenCalledTimes(2)
    })

    it('should fail list authorization', async () => {
      const route = buildRoute({type: 'destroy', byId: false, byList: true, authorization})
      const body = [uuid(), uuid()]

      findStub.mockReturnValueOnce({lastName: 'Thompson'})
      findStub.mockReturnValueOnce({lastName: 'Not-Thompson'})

      const req = {grants, body}
      const {err} = await utils.runMiddleware(route.middleware, req)

      expect(err).toBeInstanceOf(Error)
      expect(err.message).toMatch(/permission/)
      expect(destroyStub).toHaveBeenCalledTimes(0)
    })
  })
})
