const defaultModelContext = require('klay-core').defaultModelContext
const buildSpecification = require('../../dist/swagger/spec').buildSpecification
const Cache = require('../../dist/swagger/cache').SwaggerSchemaCache
const utils = require('../utils')

describe('lib/swagger/spec.ts', () => {
  let kiln

  beforeEach(() => {
    kiln = utils.state().kiln
  })

  describe('#buildSpec', () => {
    it('should build a specification', () => {
      const spec = buildSpecification(kiln)
      expect(spec).toMatchSnapshot()
    })
  })
})
