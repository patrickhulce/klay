const expect = require('chai').expect
const CRUD_ROUTES = require('../../dist/extensions/router').CRUD_ROUTES

const utils = require('../utils')

describe('lib/extensions/router.ts', () => {
  let state, kiln

  beforeEach(() => {
    state = utils.state()
    kiln = state.kiln
  })

  it('should build the router', () => {
    const route = kiln.build('user', 'express-router', {routes: CRUD_ROUTES})
    expect(route.routes).to.have.length(8)
  })
})
