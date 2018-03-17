const expect = require('chai').expect
const sinon = require('sinon')
const uuid = require('uuid').v4

const utils = require('../utils')

describe('lib/actions/destroy.ts', () => {
  let state, kiln, executor, destroyStub, transactionStub

  beforeEach(() => {
    state = utils.state()
    kiln = state.kiln
    executor = state.executor
    sinon.stub(executor, 'findByIdOrThrow').returns({})
    destroyStub = sinon.stub(executor, 'destroyById').returns(Promise.resolve())
    transactionStub = sinon.stub(executor, 'transaction', f => f('t'))
  })

  it('should build the byId route', () => {
    const route = kiln.build('user', 'express-route', {type: 'destroy'})
    expect(route.paramsModel).to.have.property('isKlayModel', true)
    expect(route.bodyModel).to.equal(undefined)
    expect(route.middleware).to.have.length.greaterThan(0)
  })

  it('should build the bulk route', () => {
    const route = kiln.build('user', 'express-route', {type: 'destroy', byId: false})
    expect(route.paramsModel).to.equal(undefined)
    expect(route.bodyModel).to.have.property('isKlayModel', true)
    expect(route.middleware).to.have.length.greaterThan(0)
  })

  it('should call destroy', async () => {
    const route = kiln.build('user', 'express-route', {type: 'destroy'})
    const id = uuid()
    const req = {params: {id}}
    const {res, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(req).to.have.nested.property('validated.params.id', id)
    expect(await res.promise).to.eql(undefined)
    expect(nextCalledAll).to.equal(true)
    expect(destroyStub.callCount).to.equal(1)
  })

  it('should call single destroy', async () => {
    const route = kiln.build('user', 'express-route', {type: 'destroy', byId: false})
    const req = {body: uuid()}
    const {res, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(req).to.have.nested.property('validated.body').a('string')
    expect(await res.promise).to.eql(undefined)
    expect(nextCalledAll).to.equal(true)
    expect(destroyStub.callCount).to.equal(1)
    expect(transactionStub.callCount).to.equal(0)
  })

  it('should call bulk destroy', async () => {
    const route = kiln.build('user', 'express-route', {type: 'destroy', byId: false, byList: true})
    const req = {body: [uuid(), uuid(), uuid()]}
    const {res, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(req).to.have.nested.property('validated.body').length(3)
    expect(await res.promise).to.eql(undefined)
    expect(nextCalledAll).to.equal(true)
    expect(destroyStub.callCount).to.equal(3)
    expect(transactionStub.callCount).to.equal(1)
    expect(destroyStub.firstCall.args[1]).to.have.property('transaction', 't')
  })

  it('should validate params', async () => {
    const route = kiln.build('user', 'express-route', {type: 'destroy'})
    const req = {params: {id: 'foo'}}
    const {res, next, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(next.firstCall.args[0]).to.be.instanceof(Error)
    expect(next.firstCall.args[0].value).to.include({id: 'foo'})
    expect(res.promise).to.equal(undefined)
    expect(nextCalledAll).to.equal(false)
    expect(destroyStub.callCount).to.equal(0)
  })

  it('should validate single body', async () => {
    const route = kiln.build('user', 'express-route', {type: 'destroy', byId: false})
    const req = {body: [uuid()]}
    const {res, next, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(next.firstCall.args[0]).to.be.instanceof(Error)
    expect(next.firstCall.args[0].value).to.eql(req.body)
    expect(res.promise).to.equal(undefined)
    expect(nextCalledAll).to.equal(false)
    expect(destroyStub.callCount).to.equal(0)
  })

  it('should validate bulk body', async () => {
    const route = kiln.build('user', 'express-route', {type: 'destroy', byId: false, byList: true})
    const req = {body: uuid()}
    const {res, next, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(next.firstCall.args[0]).to.be.instanceof(Error)
    expect(next.firstCall.args[0].value).to.eql(req.body)
    expect(res.promise).to.equal(undefined)
    expect(nextCalledAll).to.equal(false)
    expect(destroyStub.callCount).to.equal(0)
  })
})
