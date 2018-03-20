const expect = require('chai').expect
const sinon = require('sinon')

const utils = require('../utils')

describe('lib/actions/create.ts', () => {
  let state, kiln, executor, createStub, createAllStub
  const buildRoute = opts => kiln.build('user', 'express-route', opts)

  beforeEach(() => {
    state = utils.state()
    kiln = state.kiln
    executor = state.executor
    sinon.stub(executor, 'findOne').returns(undefined)
    createStub = sinon.stub(executor, 'create').returnsArg(0)
    createAllStub = sinon.stub(executor, 'createAll').returnsArg(0)
  })

  it('should build the route', () => {
    const route = buildRoute({type: 'create'})
    expect(route.bodyModel).to.have.property('isKlayModel', true)
    expect(route.middleware).to.have.length.greaterThan(0)
  })

  it('should call create', async () => {
    const route = buildRoute({type: 'create'})
    const req = {body: {...utils.defaultUser}}
    const {res, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(req).to.have.nested.property('validated.body')
    expect(req).to.not.have.nested.property('validated.body.id')
    expect(await res.promise).to.eql(req.validated.body)
    expect(nextCalledAll).to.equal(true)
    expect(createStub.callCount).to.equal(1)
  })

  it('should call createAll', async () => {
    const route = buildRoute({type: 'create', byList: true})
    const req = {body: [{...utils.defaultUser}]}
    const {res, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(req).to.have.nested.property('validated.body.0.firstName')
    expect(req).to.not.have.nested.property('validated.body.0.id')
    expect(await res.promise).to.eql(req.validated.body)
    expect(nextCalledAll).to.equal(true)
    expect(createStub.callCount).to.equal(0)
    expect(createAllStub.callCount).to.equal(1)
  })

  it('should validate body', async () => {
    const route = buildRoute({type: 'create'})
    const req = {body: {...utils.defaultUser, age: false}}
    const {res, next, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(next.firstCall.args[0]).to.be.instanceof(Error)
    expect(next.firstCall.args[0].value).to.include({age: false})
    expect(res.promise).to.equal(undefined)
    expect(nextCalledAll).to.equal(false)
    expect(createStub.callCount).to.equal(0)
  })

  it('should validate list body', async () => {
    const route = buildRoute({type: 'create', byList: true})
    const req = {body: {...utils.defaultUser}}
    const {res, next, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(next.firstCall.args[0]).to.be.instanceof(Error)
    expect(res.promise).to.equal(undefined)
    expect(nextCalledAll).to.equal(false)
    expect(createStub.callCount).to.equal(0)
    expect(createAllStub.callCount).to.equal(0)
  })

  context('authorization', () => {
    let authorization, grants

    beforeEach(() => {
      authorization = {permission: 'users:admin', criteria: [['lastName']]}
      grants = new utils.Grants('user', {id: 1, lastName: 'Thompson'}, utils.auth)
    })

    it('should pass authorization', async () => {
      const route = buildRoute({type: 'create', authorization})
      const req = {grants, body: {...utils.defaultUser}}
      const {res} = await utils.runMiddleware(route.middleware, req)

      expect(await res.promise).to.eql(req.validated.body)
      expect(createStub.callCount).to.equal(1)
    })

    it('should fail authorization', async () => {
      const route = buildRoute({type: 'create', authorization})
      const req = {grants, body: {...utils.defaultUser, lastName: 'Not-Thompson'}}
      const {res, err} = await utils.runMiddleware(route.middleware, req)

      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.match(/permission/)
      expect(res.promise).to.equal(undefined)
    })

    it('should pass list authorization', async () => {
      const route = buildRoute({type: 'create', byList: true, authorization})
      const body = [
        {...utils.defaultUser},
        {...utils.defaultUser},
      ]

      const req = {grants, body}
      const {res} = await utils.runMiddleware(route.middleware, req)

      expect(await res.promise).to.eql(req.validated.body)
      expect(createAllStub.callCount).to.equal(1)
    })

    it('should fail list authorization', async () => {
      const route = buildRoute({type: 'create', byList: true, authorization})
      const body = [
        {...utils.defaultUser},
        {...utils.defaultUser, lastName: 'Not-Thompson'},
        {...utils.defaultUser},
      ]

      const req = {grants, body}
      const {res, err} = await utils.runMiddleware(route.middleware, req)

      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.match(/permission/)
      expect(res.promise).to.equal(undefined)
    })
  })
})
