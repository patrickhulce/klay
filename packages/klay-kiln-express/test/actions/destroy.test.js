const expect = require('chai').expect
const sinon = require('sinon')
const uuid = require('uuid').v4

const utils = require('../utils')

describe('lib/actions/destroy.ts', () => {
  let state, kiln, executor, findStub, destroyStub, transactionStub
  const buildRoute = opts => kiln.build('user', 'express-route', opts)

  beforeEach(() => {
    state = utils.state()
    kiln = state.kiln
    executor = state.executor
    findStub = sinon.stub(executor, 'findByIdOrThrow').returns({lastName: 'Thompson'})
    destroyStub = sinon.stub(executor, 'destroyById').returns(Promise.resolve())
    transactionStub = sinon.stub(executor, 'transaction', f => f('t'))
  })

  it('should build the byId route', () => {
    const route = buildRoute({type: 'destroy'})
    expect(route.paramsModel).to.have.property('isKlayModel', true)
    expect(route.bodyModel).to.equal(undefined)
    expect(route.middleware).to.have.length.greaterThan(0)
  })

  it('should build the bulk route', () => {
    const route = buildRoute({type: 'destroy', byId: false})
    expect(route.paramsModel).to.equal(undefined)
    expect(route.bodyModel).to.have.property('isKlayModel', true)
    expect(route.middleware).to.have.length.greaterThan(0)
  })

  it('should call destroy', async () => {
    const route = buildRoute({type: 'destroy'})
    const id = uuid()
    const req = {params: {id}}
    const {res, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(req).to.have.nested.property('validated.params.id', id)
    expect(req)
      .to.have.property('actionTarget')
      .eql({lastName: 'Thompson'})
    expect(await res.promise).to.eql(undefined)
    expect(nextCalledAll).to.equal(true)
    expect(destroyStub.callCount).to.equal(1)
  })

  it('should call single destroy', async () => {
    const route = buildRoute({type: 'destroy', byId: false})
    const req = {body: uuid()}
    const {res, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(req)
      .to.have.nested.property('validated.body')
      .a('string')
    expect(req)
      .to.have.property('actionTarget')
      .eql({lastName: 'Thompson'})
    expect(await res.promise).to.eql(undefined)
    expect(nextCalledAll).to.equal(true)
    expect(destroyStub.callCount).to.equal(1)
    expect(transactionStub.callCount).to.equal(0)
  })

  it('should call bulk destroy', async () => {
    const route = buildRoute({type: 'destroy', byId: false, byList: true})
    const req = {body: [uuid(), uuid(), uuid()]}
    const {res, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(req)
      .to.have.nested.property('validated.body')
      .length(3)
    expect(req)
      .to.have.property('actionTarget')
      .eql([{lastName: 'Thompson'}, {lastName: 'Thompson'}, {lastName: 'Thompson'}])
    expect(await res.promise).to.eql(undefined)
    expect(nextCalledAll).to.equal(true)
    expect(destroyStub.callCount).to.equal(3)
    expect(transactionStub.callCount).to.equal(1)
    expect(destroyStub.firstCall.args[1]).to.have.property('transaction', 't')
  })

  it('should validate params', async () => {
    const route = buildRoute({type: 'destroy'})
    const req = {params: {id: 'foo'}}
    const {res, next, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(next.firstCall.args[0]).to.be.instanceof(Error)
    expect(next.firstCall.args[0].value).to.include({id: 'foo'})
    expect(res.promise).to.equal(undefined)
    expect(nextCalledAll).to.equal(false)
    expect(destroyStub.callCount).to.equal(0)
  })

  it('should validate single body', async () => {
    const route = buildRoute({type: 'destroy', byId: false})
    const req = {body: [uuid()]}
    const {res, next, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(next.firstCall.args[0]).to.be.instanceof(Error)
    expect(next.firstCall.args[0].value).to.eql(req.body)
    expect(res.promise).to.equal(undefined)
    expect(nextCalledAll).to.equal(false)
    expect(destroyStub.callCount).to.equal(0)
  })

  it('should validate bulk body', async () => {
    const route = buildRoute({type: 'destroy', byId: false, byList: true})
    const req = {body: uuid()}
    const {res, next, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(next.firstCall.args[0]).to.be.instanceof(Error)
    expect(next.firstCall.args[0].value).to.eql(req.body)
    expect(res.promise).to.equal(undefined)
    expect(nextCalledAll).to.equal(false)
    expect(destroyStub.callCount).to.equal(0)
  })

  context('authorization', () => {
    let authorization, grants

    beforeEach(() => {
      authorization = {permission: 'users:admin', criteria: [['lastName']]}
      grants = new utils.Grants('user', {id: 1, lastName: 'Thompson'}, utils.auth)
    })

    it('should pass authorization', async () => {
      const route = buildRoute({type: 'destroy', authorization})
      const req = {grants, params: {id: uuid()}}
      const {res} = await utils.runMiddleware(route.middleware, req)

      expect(await res.promise).to.eql(req.validated.body)
      expect(destroyStub.callCount).to.equal(1)
    })

    it('should fail authorization', async () => {
      const route = buildRoute({type: 'destroy', authorization})
      const req = {grants, params: {id: uuid()}}
      findStub.returns({lastName: 'Not-Thompson'})
      const {res, err} = await utils.runMiddleware(route.middleware, req)

      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.match(/permission/)
      expect(res.promise).to.equal(undefined)
    })

    it('should pass list authorization', async () => {
      const route = buildRoute({type: 'destroy', byId: false, byList: true, authorization})
      const body = [uuid(), uuid()]

      const req = {grants, body}
      await utils.runMiddleware(route.middleware, req)
      expect(destroyStub.callCount).to.equal(2)
    })

    it('should fail list authorization', async () => {
      const route = buildRoute({type: 'destroy', byId: false, byList: true, authorization})
      const body = [uuid(), uuid()]

      findStub.onCall(0).returns({lastName: 'Thompson'})
      findStub.onCall(1).returns({lastName: 'Not-Thompson'})

      const req = {grants, body}
      const {err} = await utils.runMiddleware(route.middleware, req)

      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.match(/permission/)
      expect(destroyStub.callCount).to.equal(0)
    })
  })
})
