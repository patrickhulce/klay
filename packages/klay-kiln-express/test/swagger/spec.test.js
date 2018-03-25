const buildSpecification = require('../../dist/swagger/spec').buildSpecification
const CRUD_ROUTES = require('../../dist/extensions/router').CRUD_ROUTES
const utils = require('../utils')

describe('lib/swagger/spec.ts', () => {
  let kiln

  beforeEach(() => {
    kiln = utils.state().kiln
  })

  describe('#buildSpec', () => {
    it('should build a specification', () => {
      const routerOpts = {
        routes: CRUD_ROUTES
      }

      const router = kiln.build('user', 'express-router', routerOpts)
      const spec = buildSpecification(kiln, router)
      expect(spec).toMatchSnapshot()
    })
  })
})
