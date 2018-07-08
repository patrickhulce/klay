const ModelContext = require('klay-core').ModelContext
const routersModule = require('../../lib/helpers/create-router')
const utils = require('../utils')

describe('lib/helpers/create-router.ts', () => {
  let state, kiln, context

  beforeEach(() => {
    context = new ModelContext()
    state = utils.state()
    kiln = state.kiln
  })

  describe('#createRouter', () => {
    const createRouter = routersModule.createRouter
    const handler = jest.fn()

    it('should build the router', () => {
      const router = createRouter(
        {routes: routersModule.CRUD_ROUTES},
        state.kilnModel,
        state.executor,
      )
      expect(router.routes.length).toBeGreaterThan(7)
    })

    it('should throw on incompatible params', () => {
      const intModel = context.object().children({foo: context.integer()})
      const boolModel = context.object().children({foo: context.boolean()})
      const fn = () => {
        createRouter({
          routes: {
            'GET /:foo': {paramsModel: intModel, handler},
            'PUT /:foo': {paramsModel: boolModel, handler},
          },
        })
      }

      expect(fn).toThrowError(/incompatible.*foo/)
    })

    it('should apply options to all action routes', () => {
      const router = createRouter(
        {
          defaults: {defaultLimit: 87},
          routes: {
            'GET /': 'list',
            'GET /foo': {type: 'list', defaultLimit: 50},
          },
        },
        state.kilnModel,
        state.executor,
      )

      const limitModel = route => route.queryModel.spec.children.find(x => x.path === 'limit').model
      expect(limitModel(router.routes[0])).toHaveProperty('spec.default', 87)
      expect(limitModel(router.routes[1])).toHaveProperty('spec.default', 50)
    })

    it('should apply options to all input routes', () => {
      const router = createRouter(
        {
          defaults: {bodyModel: context.string()},
          routes: {
            'PUT /': {bodyModel: context.integer(), handler},
            'PUT /foo': {handler},
          },
        },
        state.kilnModel,
        state.executor,
      )

      expect(router.routes).toHaveProperty('0.bodyModel.spec.type', 'number')
      expect(router.routes).toHaveProperty('1.bodyModel.spec.type', 'string')
    })
  })

  describe('#createAndMergeRouters', () => {
    const createRouters = routersModule.createAndMergeRouters

    it('should create routers', () => {
      const merged = createRouters(kiln, {
        '/v1/model': {
          modelName: 'user',
          databaseExtension: 'db',
          routes: {
            'GET /': {type: 'list'},
            'POST /': {type: 'create'},
          },
        },
        '/v2/model': {
          modelName: 'user',
          databaseExtension: 'db',
          routes: {
            'GET /foo': {type: 'list'},
          },
        },
      })

      expect(typeof merged.router).toBe('function')
      expect(merged.routes).toHaveLength(3)
      expect(merged.routes[0]).toHaveProperty('path', '/v1/model/')
      expect(merged.routes[2]).toHaveProperty('path', '/v2/model/foo')
    })

    it('should use existing routers', () => {
      const merged = createRouters(kiln, {
        '/v1/model': {
          routes: [],
          databaseExtension: 'db',
          router(req, res, next) {
            next()
          },
        },
        '/v2/model': {
          modelName: 'user',
          databaseExtension: 'db',
          routes: {
            'GET /foo': {type: 'list'},
          },
        },
      })

      expect(typeof merged.router).toBe('function')
      expect(merged.routes).toHaveLength(1)
    })
  })
})
