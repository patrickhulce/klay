const utils = require('../utils')

describe('lib/actions/create.ts', () => {
  let state, kiln, executor, createStub, createAllStub
  const buildRoute = opts => kiln.build('user', 'express-route', opts)

  beforeEach(() => {
    state = utils.state()
    kiln = state.kiln
    executor = state.executor
    jest.spyOn(executor, 'findOne').mockReturnValue(undefined)
    createStub = jest.spyOn(executor, 'create').mockImplementation(x => x)
    createAllStub = jest.spyOn(executor, 'createAll').mockImplementation(x => x)
  })

  it('should build the route', () => {
    const route = buildRoute({type: 'create'})
    expect(route.bodyModel).toHaveProperty('isKlayModel', true)
    expect(route.middleware.length).toBeGreaterThan(0)
  })

  it('should call create', async () => {
    const route = buildRoute({type: 'create'})
    const req = {body: {...utils.defaultUser}}
    const {res, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(req).toHaveProperty('validated.body')
    expect(req).not.toHaveProperty('validated.body.id')
    expect(await res.promise).toEqual(req.validated.body)
    expect(nextCalledAll).toBe(true)
    expect(createStub).toHaveBeenCalledTimes(1)
  })

  it('should call createAll', async () => {
    const route = buildRoute({type: 'create', byList: true})
    const req = {body: [{...utils.defaultUser}]}
    const {res, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(req).toHaveProperty('validated.body.0.firstName')
    expect(req).not.toHaveProperty('validated.body.0.id')
    expect(await res.promise).toEqual(req.validated.body)
    expect(nextCalledAll).toBe(true)
    expect(createStub).toHaveBeenCalledTimes(0)
    expect(createAllStub).toHaveBeenCalledTimes(1)
  })

  it('should validate body', async () => {
    const route = buildRoute({type: 'create'})
    const req = {body: {...utils.defaultUser, age: false}}
    const {res, next, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error)
    expect(next.mock.calls[0][0].value).toMatchObject({age: false})
    expect(res.promise).toBe(undefined)
    expect(nextCalledAll).toBe(false)
    expect(createStub).toHaveBeenCalledTimes(0)
  })

  it('should validate list body', async () => {
    const route = buildRoute({type: 'create', byList: true})
    const req = {body: {...utils.defaultUser}}
    const {res, next, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error)
    expect(res.promise).toBe(undefined)
    expect(nextCalledAll).toBe(false)
    expect(createStub).toHaveBeenCalledTimes(0)
    expect(createAllStub).toHaveBeenCalledTimes(0)
  })

  describe('authorization', () => {
    let authorization, grants

    beforeEach(() => {
      authorization = {permission: 'users:admin', criteria: [['lastName']]}
      grants = new utils.Grants('user', {id: 1, lastName: 'Thompson'}, utils.auth)
    })

    it('should pass authorization', async () => {
      const route = buildRoute({type: 'create', authorization})
      const req = {grants, body: {...utils.defaultUser}}
      const {res} = await utils.runMiddleware(route.middleware, req)

      expect(await res.promise).toEqual(req.validated.body)
      expect(createStub).toHaveBeenCalledTimes(1)
    })

    it('should fail authorization', async () => {
      const route = buildRoute({type: 'create', authorization})
      const req = {grants, body: {...utils.defaultUser, lastName: 'Not-Thompson'}}
      const {res, err} = await utils.runMiddleware(route.middleware, req)

      expect(err).toBeInstanceOf(Error)
      expect(err.message).toMatch(/permission/)
      expect(res.promise).toBe(undefined)
    })

    it('should pass list authorization', async () => {
      const route = buildRoute({type: 'create', byList: true, authorization})
      const body = [
        {...utils.defaultUser},
        {...utils.defaultUser},
      ]

      const req = {grants, body}
      const {res} = await utils.runMiddleware(route.middleware, req)

      expect(await res.promise).toEqual(req.validated.body)
      expect(createAllStub).toHaveBeenCalledTimes(1)
    })

    it('should fail list authorization', async () => {
      const route = buildRoute({type: 'create', byList: true, authorization})
      const body = [
        {...utils.defaultUser},
        {...utils.defaultUser, lastName: 'Not-Thompson'},
        {...utils.defaultUser},
      ]

      const req = {grants, body}
      const {res, err} = await utils.runMiddleware(route.middleware, req)

      expect(err).toBeInstanceOf(Error)
      expect(err.message).toMatch(/permission/)
      expect(res.promise).toBe(undefined)
    })
  })
})
