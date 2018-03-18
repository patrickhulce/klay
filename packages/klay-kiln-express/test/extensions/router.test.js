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

  it('should apply options to all action routes', () => {
    const router = kiln.build('user', 'express-router', {
      defaultLimit: 87,
      routes: {
        'GET /': 'list',
        'GET /foo': {type: 'list', defaultLimit: 50},
      },
    })

    const limitModel = route => route.queryModel.spec.children.find(x => x.path === 'limit').model
    expect(limitModel(router.routes[0])).to.have.nested.property('spec.default', 87)
    expect(limitModel(router.routes[1])).to.have.nested.property('spec.default', 50)
  })

  it('should apply options to all input routes', () => {
    const router = kiln.build('user', 'express-router', {
      bodyModel: context.string(),
      routes: {
        'PUT /': {bodyModel: context.integer(), handler},
        'PUT /foo': {handler},
      },
    })

    expect(router.routes).to.have.nested.property('0.bodyModel.spec.type', 'number')
    expect(router.routes).to.have.nested.property('1.bodyModel.spec.type', 'string')
  })
})