const uuid = require('uuid').v4

const utils = require('../utils')

describe('lib/actions/update.ts', () => {
  let state, kiln, executor, findStub, updateStub, updateAllStub
  const buildRoute = opts => kiln.build('user', 'express-route', opts)

  beforeEach(() => {
    state = utils.state()
    kiln = state.kiln
    executor = state.executor
    findStub = jest.spyOn(executor, 'findByIdOrThrow').mockReturnValue({lastName: 'Thompson'})
    updateStub = jest.spyOn(executor, 'update').mockImplementation(x => x)
    updateAllStub = jest.spyOn(executor, 'updateAll').mockImplementation(x => x)
  })

  it('should build the route', () => {
    const route = kiln.build('user', 'express-route', {type: 'update'})
    expect(route.bodyModel).toHaveProperty('isKlayModel', true)
    expect(route.middleware.length).toBeGreaterThan(0)
  })

  it('should throw if both byId and byList are set', () => {
    const fn = () => kiln.build('user', 'express-route', {type: 'update', byList: true})
    expect(fn).toThrowError(/Cannot update.*byId.*byList/)
  })

  it('should call update', async () => {
    const route = kiln.build('user', 'express-route', {type: 'update'})
    const id = uuid()
    const payload = {
      id,
      ...utils.defaultUser,
      createdAt: new Date(),
    }

    const req = {params: {id}, body: payload}
    const {res, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(req).toHaveProperty('validated.body')
    expect(req).toHaveProperty('validated.body.updatedAt', undefined)
    expect(req).toHaveProperty('actionTarget', {lastName: 'Thompson'})
    expect(await res.promise).toEqual(req.validated.body)
    expect(nextCalledAll).toBe(true)
    expect(updateStub).toHaveBeenCalledTimes(1)
  })

  it('should call updateAll', async () => {
    const route = kiln.build('user', 'express-route', {type: 'update', byId: false, byList: true})
    const id = uuid()
    const payload = {
      id,
      ...utils.defaultUser,
      createdAt: new Date(),
    }

    const req = {body: [payload]}
    const {res, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(req).toHaveProperty('validated.body.0.id')
    expect(req).toHaveProperty('validated.body.0.updatedAt', undefined)
    expect(await res.promise).toEqual(req.validated.body)
    expect(req).toHaveProperty('actionTarget', [{lastName: 'Thompson'}])
    expect(nextCalledAll).toBe(true)
    expect(updateStub).toHaveBeenCalledTimes(0)
    expect(updateAllStub).toHaveBeenCalledTimes(1)
  })

  it('should validate params', async () => {
    const route = kiln.build('user', 'express-route', {type: 'update'})
    const req = {params: {id: 'foo'}, body: {...utils.defaultUser, id: uuid()}}
    const {res, next, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error)
    expect(next.mock.calls[0][0].value).toMatchObject({id: 'foo'})
    expect(res.promise).toBe(undefined)
    expect(nextCalledAll).toBe(false)
    expect(updateStub).toHaveBeenCalledTimes(0)
  })

  it('should validate body', async () => {
    const route = kiln.build('user', 'express-route', {type: 'update'})
    const req = {params: {id: uuid()}, body: {...utils.defaultUser, age: false}}
    const {res, next, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(next.mock.calls[1][0]).toBeInstanceOf(Error)
    expect(next.mock.calls[1][0].value).toMatchObject({age: false})
    expect(res.promise).toBe(undefined)
    expect(nextCalledAll).toBe(false)
    expect(updateStub).toHaveBeenCalledTimes(0)
  })

  describe('authorization', () => {
    let authorization, grants

    beforeEach(() => {
      authorization = {permission: 'users:admin', criteria: [['lastName']]}
      grants = new utils.Grants('user', {id: 1, lastName: 'Thompson'}, utils.auth)
    })

    it('should pass authorization', async () => {
      const route = buildRoute({type: 'update', byId: false, authorization})
      const req = {grants, body: {...utils.defaultUser, id: uuid()}}
      const {res} = await utils.runMiddleware(route.middleware, req)

      expect(await res.promise).toEqual(req.validated.body)
      expect(updateStub).toHaveBeenCalledTimes(1)
    })

    it('should fail authorization for incoming', async () => {
      const route = buildRoute({type: 'update', byId: false, authorization})
      const body = {
        id: uuid(),
        ...utils.defaultUser,
        lastName: 'Not-Thompson',
      }
      const req = {grants, body}
      const {res, err} = await utils.runMiddleware(route.middleware, req)

      expect(err).toBeInstanceOf(Error)
      expect(err.message).toMatch(/permission/)
      expect(res.promise).toBe(undefined)
    })

    it('should fail authorization for existing', async () => {
      const route = buildRoute({type: 'update', byId: false, authorization})
      const body = {
        id: uuid(),
        ...utils.defaultUser,
        lastName: 'Not-Thompson',
      }
      const req = {grants, body}
      const {res, err} = await utils.runMiddleware(route.middleware, req)

      expect(err).toBeInstanceOf(Error)
      expect(err.message).toMatch(/permission/)
      expect(res.promise).toBe(undefined)
    })

    it('should pass list authorization', async () => {
      const route = buildRoute({type: 'update', byId: false, byList: true, authorization})
      const body = [{id: uuid(), ...utils.defaultUser}, {id: uuid(), ...utils.defaultUser}]

      const req = {grants, body}
      const {res} = await utils.runMiddleware(route.middleware, req)

      expect(await res.promise).toEqual(req.validated.body)
      expect(updateAllStub).toHaveBeenCalledTimes(1)
    })

    it('should fail list authorization for incoming', async () => {
      const route = buildRoute({type: 'update', byId: false, byList: true, authorization})
      const body = [
        {id: uuid(), ...utils.defaultUser},
        {id: uuid(), ...utils.defaultUser, lastName: 'Not-Thompson'},
      ]

      const req = {grants, body}
      const {res, err} = await utils.runMiddleware(route.middleware, req)

      expect(err).toBeInstanceOf(Error)
      expect(err.message).toMatch(/permission/)
      expect(res.promise).toBe(undefined)
    })

    it('should fail list authorization for existing', async () => {
      const route = buildRoute({type: 'update', byId: false, byList: true, authorization})
      const body = [{id: uuid(), ...utils.defaultUser}, {id: uuid(), ...utils.defaultUser}]

      findStub.mockReturnValueOnce({lastName: 'Thompson'})
      findStub.mockReturnValueOnce({lastName: 'Not-Thompson'})

      const req = {grants, body}
      const {res, err} = await utils.runMiddleware(route.middleware, req)

      expect(err).toBeInstanceOf(Error)
      expect(err.message).toMatch(/permission/)
      expect(res.promise).toBe(undefined)
    })
  })
})
