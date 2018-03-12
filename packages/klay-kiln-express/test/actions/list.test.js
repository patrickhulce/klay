const expect = require('chai').expect
const sinon = require('sinon')

const utils = require('../utils')

describe('lib/actions/list.ts', () => {
  let state, kiln, executor, findStub, countStub

  beforeEach(() => {
    state = utils.state()
    kiln = state.kiln
    executor = state.executor
    findStub = sinon.stub(executor, 'find').returns([])
    countStub = sinon.stub(executor, 'count').returns(5)
  })

  it('should build the route', () => {
    const route = kiln.build('user', 'express-route', {type: 'list'})
    expect(route.queryModel).to.have.property('isKlayModel', true)
    expect(route.middleware).to.have.length.greaterThan(0)
  })

  it('should call find', async () => {
    const route = kiln.build('user', 'express-route', {type: 'list'})
    const req = {query: {age: 18}}
    const {res, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(req).to.have.nested.property('validated.query.age.$eq', 18)
    expect(await res.promise).to.eql({data: [], total: 5, limit: 10, offset: 0})
    expect(nextCalledAll).to.equal(true)
    expect(findStub.callCount).to.equal(1)
    expect(countStub.callCount).to.equal(1)
    expect(findStub.firstCall.args[0]).to.eql({
      limit: 10,
      offset: 0,
      where: {age: {$eq: 18}},
    })
  })

  it('should validate query', async () => {
    const route = kiln.build('user', 'express-route', {type: 'list'})
    const req = {query: {age: 'whaa'}}
    const {res, next, nextCalledAll} = await utils.runMiddleware(route.middleware, req)
    expect(next.firstCall.args[0]).to.be.instanceof(Error)
    expect(next.firstCall.args[0].value).to.include({limit: 10})
    expect(res.promise).to.equal(undefined)
    expect(nextCalledAll).to.equal(false)
    expect(findStub.callCount).to.equal(0)
  })
})
