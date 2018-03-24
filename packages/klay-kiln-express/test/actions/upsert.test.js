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
    expect(route.bodyModel).toHaveProperty('isKlayModel', true)
    expect(route.middleware.length).toBeGreaterThan(0)
  })

  it('should call upsert', async () => {
    const route = kiln.build('user', 'express-route', {type: 'upsert'})
    const req = {body: {...utils.defaultUser}}
    const {res, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(req).toHaveProperty('validated.body')
    expect(req).not.toHaveProperty('validated.body.id')
    expect(await res.promise).toEqual(req.validated.body)
    expect(nextCalledAll).toBe(true)
    expect(upsertStub.callCount).toBe(1)
  })

  it('should call upsertAll', async () => {
    const route = kiln.build('user', 'express-route', {type: 'upsert', byList: true})
    const req = {body: [{...utils.defaultUser}]}
    const {res, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(req).toHaveProperty('validated.body.0.firstName')
    expect(req).not.toHaveProperty('validated.body.0.id')
    expect(await res.promise).toEqual(req.validated.body)
    expect(nextCalledAll).toBe(true)
    expect(upsertStub.callCount).toBe(0)
    expect(upsertAllStub.callCount).toBe(1)
  })

  it('should validate body', async () => {
    const route = kiln.build('user', 'express-route', {type: 'upsert'})
    const req = {body: {...utils.defaultUser, age: false}}
    const {res, next, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(next.firstCall.args[0]).toBeInstanceOf(Error)
    expect(next.firstCall.args[0].value).toMatchObject({age: false})
    expect(res.promise).toBe(undefined)
    expect(nextCalledAll).toBe(false)
    expect(upsertStub.callCount).toBe(0)
  })
})
