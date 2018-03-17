const expect = require('chai').expect
const sinon = require('sinon')

const utils = require('../utils')

describe('lib/actions/upsert.ts', () => {
  let state, kiln, executor, upsertStub, upsertAllStub

  beforeEach(() => {
    state = utils.state()
    kiln = state.kiln
    executor = state.executor
    sinon.stub(executor, 'findOne').returns(undefined)
    upsertStub = sinon.stub(executor, 'upsert').returnsArg(0)
    upsertAllStub = sinon.stub(executor, 'upsertAll').returnsArg(0)
  })

  it('should build the route', () => {
    const route = kiln.build('user', 'express-route', {type: 'upsert'})
    expect(route.bodyModel).to.have.property('isKlayModel', true)
    expect(route.middleware).to.have.length.greaterThan(0)
  })

  it('should call upsert', async () => {
    const route = kiln.build('user', 'express-route', {type: 'upsert'})
    const req = {body: {...utils.defaultUser}}
    const {res, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(req).to.have.nested.property('validated.body')
    expect(req).to.not.have.nested.property('validated.body.id')
    expect(await res.promise).to.eql(req.validated.body)
    expect(nextCalledAll).to.equal(true)
    expect(upsertStub.callCount).to.equal(1)
  })

  it('should call upsertAll', async () => {
    const route = kiln.build('user', 'express-route', {type: 'upsert', byList: true})
    const req = {body: [{...utils.defaultUser}]}
    const {res, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(req).to.have.nested.property('validated.body.0.firstName')
    expect(req).to.not.have.nested.property('validated.body.0.id')
    expect(await res.promise).to.eql(req.validated.body)
    expect(nextCalledAll).to.equal(true)
    expect(upsertStub.callCount).to.equal(0)
    expect(upsertAllStub.callCount).to.equal(1)
  })

  it('should validate body', async () => {
    const route = kiln.build('user', 'express-route', {type: 'upsert'})
    const req = {body: {...utils.defaultUser, age: false}}
    const {res, next, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(next.firstCall.args[0]).to.be.instanceof(Error)
    expect(next.firstCall.args[0].value).to.include({age: false})
    expect(res.promise).to.equal(undefined)
    expect(nextCalledAll).to.equal(false)
    expect(upsertStub.callCount).to.equal(0)
  })
})
