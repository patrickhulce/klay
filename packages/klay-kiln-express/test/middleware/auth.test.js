const jwt = require('jsonwebtoken')
const createNewPasswordHashSalt = require('klay-db/lib/password').createNewPasswordHashSalt
const middlewareModule = require('../../lib/middleware/auth')
const Grants = require('../../lib/auth/grants').Grants
const utils = require('../utils')

describe('lib/middleware/auth.ts', () => {
  let next, state

  beforeEach(() => {
    next = jest.fn()
    state = utils.state()
  })

  describe('#createGrantCreationMiddleware', () => {
    let roles, permissions, getStub
    const createMiddleware = middlewareModule.createGrantCreationMiddleware

    beforeEach(() => {
      roles = {
        admin: [{permission: 'write', criteria: {orgId: '<%= orgId %>'}}],
        user: [{permission: 'read', criteria: {orgId: '<%= orgId %>'}}],
      }
      permissions = {write: ['read'], read: []}
      getStub = jest.fn()
    })

    it('should create grants when empty', async () => {
      const middleware = createMiddleware({roles, permissions})
      const req = {}

      await middleware(req, {}, next)
      expect(next).toHaveBeenCalledTimes(1)
      expect(req).toHaveProperty('grants')
      expect(req.grants._grants.size).toBe(0)
    })

    it('should create grants from bearer token', async () => {
      const secret = 'the-secret'
      const middleware = createMiddleware({roles, permissions, secret})
      const req = {get: getStub}

      const token = jwt.sign({orgId: 2, role: 'admin'}, secret)
      getStub.mockReturnValue(`bearer ${token}`)

      await middleware(req, {}, next)
      expect(getStub).toHaveBeenCalledTimes(1)
      expect(next).toHaveBeenCalledTimes(1)
      expect(req).toHaveProperty('grants')
      expect(req.grants.has('write', {orgId: 2})).toBe(true)
    })

    it('should create grants from cookie token', async () => {
      const secret = 'the-secret'
      const token = jwt.sign({orgId: 2, role: 'admin'}, secret)
      const middleware = createMiddleware({roles, permissions, secret})
      const req = {get: getStub, cookies: {token}}

      await middleware(req, {}, next)
      expect(getStub).toHaveBeenCalledTimes(1)
      expect(next).toHaveBeenCalledTimes(1)
      expect(req).toHaveProperty('grants')
      expect(req.grants.has('write', {orgId: 2})).toBe(true)
    })

    it('should create grants when populated', async () => {
      const middleware = createMiddleware({roles, permissions})
      const req = {user: {orgId: 2, role: 'admin'}}

      await middleware(req, {}, next)
      expect(next).toHaveBeenCalledTimes(1)
      expect(req).toHaveProperty('grants')
      expect(req.grants.has('write', {orgId: 2})).toBe(true)
      expect(req.grants.has('read', {orgId: 2})).toBe(true)
      expect(req.grants.has('write', {orgId: 3})).toBe(false)
    })

    it('should create grants with custom role finder', async () => {
      const getRoles = user => [user.theRole]
      const middleware = createMiddleware({roles, permissions, getRoles})
      const req = {user: {orgId: 2, theRole: 'admin'}}

      await middleware(req, {}, next)
      expect(next).toHaveBeenCalledTimes(1)
      expect(req).toHaveProperty('grants')
      expect(req.grants.has('write', {orgId: 2})).toBe(true)
      expect(req.grants.has('read', {orgId: 2})).toBe(true)
      expect(req.grants.has('write', {orgId: 3})).toBe(false)
    })

    it('should create grants with custom user finder', async () => {
      const getUserContext = req => req.foo
      const middleware = createMiddleware({roles, permissions, getUserContext})
      const req = {foo: {orgId: 2, role: 'user'}}

      await middleware(req, {}, next)
      expect(next).toHaveBeenCalledTimes(1)
      expect(req).toHaveProperty('grants')
      expect(req.grants.has('write', {orgId: 2})).toBe(false)
      expect(req.grants.has('read', {orgId: 2})).toBe(true)
    })

    it('should handle errors', async () => {
      const getUserContext = () => {
        throw new Error('oops')
      }
      const middleware = createMiddleware({roles, permissions, getUserContext})
      const req = {}

      await middleware(req, {}, next)
      expect(next).toHaveBeenCalledTimes(1)
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error)
      expect(next.mock.calls[0][0].message).toEqual('oops')
    })
  })

  describe('#createPasswordValidationMiddleware', () => {
    let req, grants, kiln, passwordOptions
    const createMiddleware = middlewareModule.createPasswordValidationMiddleware

    beforeEach(() => {
      kiln = state.kiln
      grants = {userContext: {}}
      req = {grants, get: jest.fn()}
      passwordOptions = state.model.spec.children.find(child => child.path === 'password').model
        .spec.db.password
    })

    it('should throw without kiln', () => {
      expect(() => createMiddleware({})).toThrowError()
    })

    it('should pass when given current password', async () => {
      const hashedPassword = await createNewPasswordHashSalt('password', passwordOptions)
      const middleware = createMiddleware({kiln, databaseExtensionName: 'db'})
      req.grants.userContext.password = hashedPassword
      req.get.mockReturnValue('password')

      const {next} = await utils.runMiddleware([middleware], req)
      expect(next).toHaveBeenCalled()
      expect(next.mock.calls[0]).toEqual([])
    })

    it('should fail when not given current password', async () => {
      const hashedPassword = await createNewPasswordHashSalt('password', passwordOptions)
      const middleware = createMiddleware({kiln, databaseExtensionName: 'db'})
      req.grants.userContext.password = hashedPassword

      const {next, err} = await utils.runMiddleware([middleware], req)
      expect(next).toHaveBeenCalled()
      expect(err.message).toMatchSnapshot()
    })

    it('should fail when given wrong password', async () => {
      const hashedPassword = await createNewPasswordHashSalt('password', passwordOptions)
      const middleware = createMiddleware({kiln, databaseExtensionName: 'db'})
      req.grants.userContext.password = hashedPassword
      req.body = {currentPassword: 'foo', password: 'password'}

      const {next, err} = await utils.runMiddleware([middleware], req)
      expect(next).toHaveBeenCalled()
      expect(err.message).toMatchSnapshot()
    })
  })

  describe('#createGrantValidationMiddleware', () => {
    let roles, permissions, grants, getAffectedCriteriaValues
    const createMiddleware = middlewareModule.createGrantValidationMiddleware

    beforeEach(() => {
      roles = {
        root: [{permission: 'write', criteria: '*'}],
        user: [
          {permission: 'write', criteria: {orgId: '<%= orgId %>', userId: '<%= id %>'}},
          {permission: 'read', criteria: {orgId: '<%= orgId %>'}},
        ],
        guest: [{permission: 'read', criteria: {public: true}}],
      }

      permissions = {write: ['read'], read: []}
      grants = new Grants(['user'], {id: 1, orgId: 2}, {roles, permissions})
      getAffectedCriteriaValues = (req, prop) => [req[prop]]
    })

    it('should throw when getAffectedCriteriaValues not set', () => {
      const fn = () => createMiddleware({permission: 'read'})
      expect(fn).toThrowError(/getAffectedCriteriaValues/)
    })

    it('should fail request if grants property not set', () => {
      const middleware = createMiddleware({
        permission: 'read',
        getAffectedCriteriaValues,
      })

      middleware({}, {}, next)
      expect(next).toHaveBeenCalledTimes(1)
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error)
    })

    it('should pass request if global access', () => {
      grants = new Grants(['root'], {}, {roles, permissions})

      const middleware = createMiddleware({
        permission: 'read',
        getAffectedCriteriaValues,
      })

      middleware({grants}, {}, next)
      expect(next).toHaveBeenCalledTimes(1)
      expect(next.mock.calls[0]).toHaveLength(0)
    })

    it('should pass request if matches the criteria', () => {
      const middleware = createMiddleware({
        permission: 'read',
        getAffectedCriteriaValues,
      })

      middleware({grants, orgId: 2}, {}, next)
      expect(next).toHaveBeenCalledTimes(1)
      expect(next.mock.calls[0]).toHaveLength(0)
    })

    it('should pass request if matches multi-criteria', () => {
      const middleware = createMiddleware({
        permission: 'write',
        getAffectedCriteriaValues,
      })

      middleware({grants, userId: 1, orgId: 2}, {}, next)
      expect(next).toHaveBeenCalledTimes(1)
      expect(next.mock.calls[0]).toHaveLength(0)
    })

    it('should pass request if matches one the criteria', () => {
      const middleware = createMiddleware({
        permission: 'read',
        getAffectedCriteriaValues,
      })

      middleware({grants, userId: 100, orgId: 2}, {}, next)
      expect(next).toHaveBeenCalledTimes(1)
      expect(next.mock.calls[0]).toHaveLength(0)
    })

    it('should fail request if not matches the criteria', () => {
      const middleware = createMiddleware({
        permission: 'read',
        getAffectedCriteriaValues,
      })

      middleware({grants, orgId: 3}, {}, next)
      expect(next).toHaveBeenCalledTimes(1)
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error)
    })

    it('should fail request if not matches multi-criteria', () => {
      const middleware = createMiddleware({
        permission: 'write',
        getAffectedCriteriaValues,
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
