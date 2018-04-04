const utils = require('../utils')

describe('lib/actions/list.ts', () => {
  let state, kiln, executor, findStub, countStub

  beforeEach(() => {
    state = utils.state()
    kiln = state.kiln
    executor = state.executor
    findStub = jest.spyOn(executor, 'find').mockReturnValue([])
    countStub = jest.spyOn(executor, 'count').mockReturnValue(5)
  })

  it('should build the route', () => {
    const route = kiln.build('user', 'express-route', {type: 'list'})
    expect(route.queryModel).toHaveProperty('isKlayModel', true)
    expect(route.middleware.length).toBeGreaterThan(0)
  })

  it('should call find', async () => {
    const route = kiln.build('user', 'express-route', {type: 'list'})
    const req = {query: {age: {$ne: '18'}, firstName: 'Klay'}}
    const {res, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(req).toHaveProperty('validated.query.age.$ne', 18)
    expect(req).toHaveProperty('validated.query.firstName.$eq', 'Klay')
    expect(await res.promise).toEqual({data: [], total: 5, limit: 10, offset: 0})
    expect(nextCalledAll).toBe(true)
    expect(findStub).toHaveBeenCalledTimes(1)
    expect(countStub).toHaveBeenCalledTimes(1)
    expect(findStub.mock.calls[0][0]).toEqual({
      limit: 10,
      offset: 0,
      where: {age: {$ne: 18}, firstName: {$eq: 'Klay'}},
    })
  })

  it('should validate query', async () => {
    const route = kiln.build('user', 'express-route', {type: 'list'})
    const req = {query: {age: 'whaa'}}
    const {res, next, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error)
    expect(next.mock.calls[0][0].value).toMatchObject({limit: 10})
    expect(res.promise).toBe(undefined)
    expect(nextCalledAll).toBe(false)
    expect(findStub).toHaveBeenCalledTimes(0)
  })

  it('should return response model', () => {
    const route = kiln.build('user', 'express-route', {type: 'list'})
    expect(route).toHaveProperty('responseModel.spec.type', 'object')
    expect(route.responseModel.spec.children).toBeInstanceOf(Array)
  })

  describe('authorization', () => {
    let authorization, grants

    beforeEach(() => {
      authorization = {permission: 'users:admin', criteria: [['lastName']]}
      grants = new utils.Grants(['user'], {id: 1, lastName: 'Thompson'}, utils.auth)
    })

    it('should pass authorization', async () => {
      const route = kiln.build('user', 'express-route', {type: 'list', authorization})
      const req = {grants, query: {lastName: 'Thompson'}}
      const {res} = await utils.runMiddleware(route.middleware, req)

      expect(await res.promise).toMatchObject({data: []})
      expect(findStub).toHaveBeenCalledTimes(1)
    })

    it('should fail authorization', async () => {
      const route = kiln.build('user', 'express-route', {type: 'list', authorization})
      const req = {grants}
      const {res, err} = await utils.runMiddleware(route.middleware, req)

      expect(err).toBeInstanceOf(Error)
      expect(err.message).toMatch(/permission/)
      expect(res.promise).toBe(undefined)
    })
  })
})
