const expect = require('chai').expect
const sinon = require('sinon')
const ModelContext = require('klay-core').ModelContext
const middlewareModule = require('../../dist/helpers/create-middleware')

describe('lib/helpers/create-middleware.ts', () => {
  let context, model, next

  beforeEach(() => {
    context = new ModelContext()
    model = context.object().children({id: context.integer()})
    next = sinon.stub()
  })

  describe('#createValidationMiddleware', () => {
    const createMiddleware = middlewareModule.createValidationMiddleware

    it('should create a function', () => {
      const middleware = createMiddleware(model)
      expect(middleware).to.be.a('function')
    })

    it('should set validated', () => {
      const middleware = createMiddleware(model)
      const req = {body: {id: '1'}}
      middleware(req, {}, next)
      expect(req.validated).to.eql({body: {id: 1}})
      expect(req.body).to.eql({id: '1'})
      expect(next.callCount).to.equal(1)
    })

    it('should merge validated', () => {
      const middleware = createMiddleware(model, 'query')
      const req = {body: {id: '1'}, validated: {params: 1}}
      middleware(req, {}, next)
      expect(req.validated).to.eql({params: 1, query: undefined})
      expect(req.body).to.eql({id: '1'})
    })

    it('should validate against model', () => {
      const middleware = createMiddleware(model)
      const req = {body: {id: 'one'}}
      const res = {}

      middleware(req, res, next)
      expect(next.callCount).to.equal(1)
      const err = next.firstCall.args[0]
      expect(err.value).to.eql({id: 'one'})
      expect(err.errors).to.have.length(1)
      expect(err.errors[0].path).to.eql(['id'])
      expect(err.errors[0].message).to.match(/expected.*number/)
    })
  })

  describe('#createGrantCreationMiddleware', () => {
    let roles, permissions
    const createMiddleware = middlewareModule.createGrantCreationMiddleware

    beforeEach(() => {
      roles = {
        admin: [{permission: 'write', criteria: ['orgId=<%= orgId %>']}],
        user: [{permission: 'read', criteria: ['orgId<%= orgId %>']}],
      }
      permissions = {write: ['read'], read: []}
    })

    it('should create grants when empty', () => {
      const middleware = createMiddleware({roles, permissions})
      const req = {}

      middleware(req, {}, next)
      expect(next.callCount).to.equal(1)
      expect(req).to.have.property('grants')
      expect(req.grants._grants.size).to.equal(0)
    })

    it('should create grants when populated', () => {
      const middleware = createMiddleware({roles, permissions})
      const req = {user: {orgId: 2, role: 'admin'}}

      middleware(req, {}, next)
      expect(next.callCount).to.equal(1)
      expect(req).to.have.property('grants')
      expect(req.grants.has('write', {orgId: 2})).to.equal(true)
      expect(req.grants.has('read', {orgId: 2})).to.equal(true)
      expect(req.grants.has('write', {orgId: 3})).to.equal(false)
    })

    it('should create grants with custom role finder', () => {
      const getRole = user => user.theRole
      const middleware = createMiddleware({roles, permissions, getRole})
      const req = {user: {orgId: 2, theRole: 'admin'}}

      middleware(req, {}, next)
      expect(next.callCount).to.equal(1)
      expect(req).to.have.property('grants')
      expect(req.grants.has('write', {orgId: 2})).to.equal(true)
      expect(req.grants.has('read', {orgId: 2})).to.equal(true)
      expect(req.grants.has('write', {orgId: 3})).to.equal(false)
    })
  })
})
