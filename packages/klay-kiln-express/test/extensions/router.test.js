const expect = require('chai').expect
const ModelContext = require('klay-core').ModelContext
const CRUD_ROUTES = require('../../dist/extensions/router').CRUD_ROUTES

const utils = require('../utils')

const handler = (req, res, next) => next()

describe('lib/extensions/router.ts', () => {
  let context, state, kiln

  beforeEach(() => {
    context = new ModelContext()
    state = utils.state()
    kiln = state.kiln
  })

  it('should build the router', () => {
    const router = kiln.build('user', 'express-router', {routes: CRUD_ROUTES})
    expect(router.routes).to.have.length.greaterThan(7)
  })

  it('should throw on incompatible params', () => {
    const intModel = context.object().children({foo: context.integer()})
    const boolModel = context.object().children({foo: context.boolean()})
    const fn = () => {
      kiln.build('user', 'express-router', {
        routes: {
          'GET /:foo': {paramsModel: intModel, handler},
          'PUT /:foo': {paramsModel: boolModel, handler},
        },
      })
    }

    expect(fn).to.throw(/incompatible.*foo/)
  })
})
