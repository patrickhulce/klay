const middlewareModule = require('../../lib/middleware/auth')
const Grants = require('../../lib/auth/grants').Grants

describe('lib/middleware/auth.ts', () => {
  let next

  beforeEach(() => {
    next = jest.fn()
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
