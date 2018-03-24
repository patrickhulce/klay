
const ModelContext = require('klay-core').ModelContext
const middlewareModule = require('../../dist/helpers/create-middleware')
const Grants = require('../../dist/auth/grants').Grants

describe('lib/helpers/create-middleware.ts', () => {
  let context, model, next

  beforeEach(() => {
    context = new ModelContext()
    model = context.object().children({id: context.integer()})
    next = jest.fn()
  })

  describe('#createValidationMiddleware', () => {
    const createMiddleware = middlewareModule.createValidationMiddleware

    it('should create a function', () => {
      const middleware = createMiddleware(model)
      expect(typeof middleware).toBe('function')
    })

    it('should set validated', () => {
      const middleware = createMiddleware(model)
      const req = {body: {id: '1'}}
      middleware(req, {}, next)
      expect(req.validated).toEqual({body: {id: 1}})
      expect(req.body).toEqual({id: '1'})
      expect(next).toHaveBeenCalledTimes(1)
    })

    it('should merge validated', () => {
      const middleware = createMiddleware(model, 'query')
      const req = {body: {id: '1'}, validated: {params: 1}}
      middleware(req, {}, next)
      expect(req.validated).toEqual({params: 1, query: undefined})
      expect(req.body).toEqual({id: '1'})
    })

    it('should validate against model', () => {
      const middleware = createMiddleware(model)
      const req = {body: {id: 'one'}}
      const res = {}

      middleware(req, res, next)
      expect(next).toHaveBeenCalledTimes(1)
      const err = next.mock.calls[0][0]
      expect(err.value).toEqual({id: 'one'})
      expect(err.errors).toHaveLength(1)
      expect(err.errors[0].path).toEqual(['id'])
      expect(err.errors[0].message).toMatch(/expected.*number/)
    })
  })

  describe('#createGrantCreationMiddleware', () => {
    let roles, permissions
    const createMiddleware = middlewareModule.createGrantCreationMiddleware

    beforeEach(() => {
      roles = {
        admin: [{permission: 'write', criteria: ['orgId=<%= orgId %>']}],
        user: [{permission: 'read', criteria: ['orgId=<%= orgId %>']}],
      }
      permissions = {write: ['read'], read: []}
    })

    it('should create grants when empty', () => {
      const middleware = createMiddleware({roles, permissions})
      const req = {}

      middleware(req, {}, next)
      expect(next).toHaveBeenCalledTimes(1)
      expect(req).toHaveProperty('grants')
      expect(req.grants._grants.size).toBe(0)
    })

    it('should create grants when populated', () => {
      const middleware = createMiddleware({roles, permissions})
      const req = {user: {orgId: 2, role: 'admin'}}

      middleware(req, {}, next)
      expect(next).toHaveBeenCalledTimes(1)
      expect(req).toHaveProperty('grants')
      expect(req.grants.has('write', {orgId: 2})).toBe(true)
      expect(req.grants.has('read', {orgId: 2})).toBe(true)
      expect(req.grants.has('write', {orgId: 3})).toBe(false)
    })

    it('should create grants with custom role finder', () => {
      const getRole = user => user.theRole
      const middleware = createMiddleware({roles, permissions, getRole})
      const req = {user: {orgId: 2, theRole: 'admin'}}

      middleware(req, {}, next)
      expect(next).toHaveBeenCalledTimes(1)
      expect(req).toHaveProperty('grants')
      expect(req.grants.has('write', {orgId: 2})).toBe(true)
      expect(req.grants.has('read', {orgId: 2})).toBe(true)
      expect(req.grants.has('write', {orgId: 3})).toBe(false)
    })

    it('should create grants with custom user finder', () => {
      const getUserContext = req => req.foo
      const middleware = createMiddleware({roles, permissions, getUserContext})
      const req = {foo: {orgId: 2, role: 'user'}}

      middleware(req, {}, next)
      expect(next).toHaveBeenCalledTimes(1)
      expect(req).toHaveProperty('grants')
      expect(req.grants.has('write', {orgId: 2})).toBe(false)
      expect(req.grants.has('read', {orgId: 2})).toBe(true)
    })
  })

  describe('#createGrantValidationMiddleware', () => {
    let roles, permissions, grants, getCriteriaValues
    const createMiddleware = middlewareModule.createGrantValidationMiddleware

    beforeEach(() => {
      roles = {
        root: [{permission: 'write', criteria: '*'}],
        user: [
          {permission: 'write', criteria: ['orgId=<%= orgId %>', 'userId=<%= id %>']},
          {permission: 'read', criteria: ['orgId=<%= orgId %>']},
        ],
      }

      permissions = {write: ['read'], read: []}
      grants = new Grants('user', {id: 1, orgId: 2}, {roles, permissions})
      getCriteriaValues = (req, prop) => [req[prop]]
    })

    it('should throw when getCriteriaValues not set', () => {
      const fn = () => createMiddleware({permission: 'read', criteria: [['orgId']]})
      expect(fn).toThrowError(/getCriteriaValues/)
    })

    it('should fail request if grants property not set', () => {
      const middleware = createMiddleware({
        permission: 'read',
        criteria: [['orgId']],
        getCriteriaValues,
      })
      middleware({}, {}, next)
      expect(next).toHaveBeenCalledTimes(1)
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error)
    })

    it('should pass request if global access', () => {
      grants = new Grants('root', {}, {roles, permissions})

      const middleware = createMiddleware({
        permission: 'read',
        criteria: [['orgId']],
        getCriteriaValues,
      })

      middleware({grants}, {}, next)
      expect(next).toHaveBeenCalledTimes(1)
      expect(next.mock.calls[0]).toHaveLength(0)
    })

    it('should pass request if matches the criteria', () => {
      const middleware = createMiddleware({
        permission: 'read',
        criteria: [['orgId']],
        getCriteriaValues,
      })

      middleware({grants, orgId: 2}, {}, next)
      expect(next).toHaveBeenCalledTimes(1)
      expect(next.mock.calls[0]).toHaveLength(0)
    })

    it('should pass request if matches multi-criteria', () => {
      const middleware = createMiddleware({
        permission: 'write',
        criteria: [['userId', 'orgId']],
        getCriteriaValues,
      })

      middleware({grants, userId: 1, orgId: 2}, {}, next)
      expect(next).toHaveBeenCalledTimes(1)
      expect(next.mock.calls[0]).toHaveLength(0)
    })

    it('should pass request if matches one the criteria', () => {
      const middleware = createMiddleware({
        permission: 'read',
        criteria: [['userId'], ['orgId']],
        getCriteriaValues,
      })

      middleware({grants, userId: 100, orgId: 2}, {}, next)
      expect(next).toHaveBeenCalledTimes(1)
      expect(next.mock.calls[0]).toHaveLength(0)
    })

    it('should fail request if not matches the criteria', () => {
      const middleware = createMiddleware({
        permission: 'read',
        criteria: [['orgId']],
        getCriteriaValues,
      })

      middleware({grants, orgId: 3}, {}, next)
      expect(next).toHaveBeenCalledTimes(1)
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error)
    })

    it('should fail request if not matches all criteria properties', () => {
      const middleware = createMiddleware({
        permission: 'read',
        criteria: [['userId', 'orgId']],
        getCriteriaValues,
      })

      middleware({grants, userId: 1, orgId: 2}, {}, next)
      expect(next).toHaveBeenCalledTimes(1)
      expect(next.mock.calls[0]).toHaveLength(0)

      middleware({grants, userId: 2, orgId: 2}, {}, next)
      expect(next).toHaveBeenCalledTimes(2)
      expect(next.mock.calls[1][0]).toBeInstanceOf(Error)

      middleware({grants, userId: 1, orgId: 3}, {}, next)
      expect(next).toHaveBeenCalledTimes(3)
      expect(next.mock.calls[2][0]).toBeInstanceOf(Error)
    })
  })
})
