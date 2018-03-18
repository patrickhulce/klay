const expect = require('chai').expect
const sinon = require('sinon')
const uuid = require('uuid').v4

const utils = require('../utils')

describe('lib/actions/read.ts', () => {
  let state, kiln, executor, readStub

  beforeEach(() => {
    state = utils.state()
    kiln = state.kiln
    executor = state.executor
    readStub = sinon.stub(executor, 'findByIdOrThrow').returns({foo: 'bar'})
  })

  it('should build the route', () => {
    const route = kiln.build('user', 'express-route', {type: 'read'})
    expect(route.paramsModel).to.have.property('isKlayModel', true)
    expect(route.middleware).to.have.length.greaterThan(0)
  })

  it('should call read', async () => {
    const route = kiln.build('user', 'express-route', {type: 'read'})
    const id = uuid()
    const req = {params: {id}}
    const {res, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(req).to.have.nested.property('validated.params.id', id)
    expect(req).to.have.property('actionTarget').eql({foo: 'bar'})
    expect(await res.promise).to.eql({foo: 'bar'})
    expect(nextCalledAll).to.equal(true)
    expect(readStub.callCount).to.equal(1)
  })

  it('should validate params', async () => {
    const route = kiln.build('user', 'express-route', {type: 'read'})
    const req = {params: {id: 'foo'}}
    const {res, next, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(next.firstCall.args[0]).to.be.instanceof(Error)
    expect(next.firstCall.args[0].value).to.include({id: 'foo'})
    expect(res.promise).to.equal(undefined)
    expect(nextCalledAll).to.equal(false)
    expect(readStub.callCount).to.equal(0)
  })
})
