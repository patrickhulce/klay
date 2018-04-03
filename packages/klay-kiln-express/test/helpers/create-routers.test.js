const routersModule = require('../../lib/helpers/create-router')
const utils = require('../utils')

describe('lib/helpers/create-router.ts', () => {
  let kiln

  beforeEach(() => {
    const state = utils.state()
    kiln = state.kiln
  })

  describe('#createAndMergeRouters', () => {
    const createRouters = routersModule.createAndMergeRouters

    it('should create routers', () => {
      const merged = createRouters(kiln, {
        '/v1/model': {
          modelName: 'user',
          routes: {
            'GET /': {type: 'list'},
            'POST /': {type: 'create'},
          },
        },
        '/v2/model': {
          modelName: 'user',
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
          router(req, res, next) {
            next()
          },
        },
        '/v2/model': {
          modelName: 'user',
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
