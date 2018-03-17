const expect = require('chai').expect
const sinon = require('sinon')
const uuid = require('uuid').v4

const utils = require('../utils')

describe('lib/actions/update.ts', () => {
  let state, kiln, executor, updateStub, updateAllStub

  beforeEach(() => {
    state = utils.state()
    kiln = state.kiln
    executor = state.executor
    sinon.stub(executor, 'findOne').returns(undefined)
    updateStub = sinon.stub(executor, 'update').returnsArg(0)
    updateAllStub = sinon.stub(executor, 'updateAll').returnsArg(0)
  })

  it('should build the route', () => {
    const route = kiln.build('user', 'express-route', {type: 'update'})
    expect(route.bodyModel).to.have.property('isKlayModel', true)
    expect(route.middleware).to.have.length.greaterThan(0)
  })

  it('should throw if both byId and byList are set', () => {
    const fn = () => kiln.build('user', 'express-route', {type: 'update', byList: true})
    expect(fn).to.throw(/Cannot update.*byId.*byList/)
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
    expect(req).to.have.nested.property('validated.body')
    expect(req).to.have.nested.property('validated.body.updatedAt', undefined)
    expect(await res.promise).to.eql(req.validated.body)
    expect(nextCalledAll).to.equal(true)
    expect(updateStub.callCount).to.equal(1)
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
    expect(req).to.have.nested.property('validated.body.0.id')
    expect(req).to.have.nested.property('validated.body.0.updatedAt', undefined)
    expect(await res.promise).to.eql(req.validated.body)
    expect(nextCalledAll).to.equal(true)
    expect(updateStub.callCount).to.equal(0)
    expect(updateAllStub.callCount).to.equal(1)
  })

  it('should validate params', async () => {
    const route = kiln.build('user', 'express-route', {type: 'update'})
    const req = {params: {id: 'foo'}, body: {...utils.defaultUser, id: uuid()}}
    const {res, next, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(next.firstCall.args[0]).to.be.instanceof(Error)
    expect(next.firstCall.args[0].value).to.include({id: 'foo'})
    expect(res.promise).to.equal(undefined)
    expect(nextCalledAll).to.equal(false)
    expect(updateStub.callCount).to.equal(0)
  })

  it('should validate body', async () => {
    const route = kiln.build('user', 'express-route', {type: 'update'})
    const req = {params: {id: uuid()}, body: {...utils.defaultUser, age: false}}
    const {res, next, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(next.secondCall.args[0]).to.be.instanceof(Error)
    expect(next.secondCall.args[0].value).to.include({age: false})
    expect(res.promise).to.equal(undefined)
    expect(nextCalledAll).to.equal(false)
    expect(updateStub.callCount).to.equal(0)
  })
})
