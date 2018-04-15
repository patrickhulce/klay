const defaultModelContext = require('klay-core').defaultModelContext
const buildSpecification = require('../../lib/swagger/spec').buildSpecification
const routerModule = require('../../lib/helpers/create-router')
const utils = require('../utils')

describe('lib/swagger/spec.ts', () => {
  let kiln, state

  beforeEach(() => {
    state = utils.state()
    kiln = state.kiln
  })

  describe('#buildSpec', () => {
    it('should build a specification', () => {
      const routerOpts = {
        routes: {
          ...routerModule.CRUD_ROUTES,
          'POST /extras/': {
            actionName: 'Build Extras',
            bodyModel: defaultModelContext.boolean(),
            handler: jest.fn(),
          },
        },
      }

      const router = routerModule.createRouter(routerOpts, state.kilnModel, state.executor)
      const spec = buildSpecification(kiln, router)
      expect(spec).toMatchSnapshot()
    })
  })
})
