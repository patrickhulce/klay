const defaultModelContext = require('klay-core').defaultModelContext
const components = require('../../dist/swagger/components')
const Cache = require('../../dist/swagger/cache').SwaggerSchemaCache
const utils = require('../utils')

describe('lib/swagger/components.ts', () => {
  let model

  beforeEach(() => {
    model = utils.state().model
  })

  describe('#getSchema', () => {
    it('should build an object schema', () => {
      const schema = components.getSchema(model)
      expect(schema).toMatchSnapshot()
    })

    it('should build an array schema', () => {
      const arrayModel = defaultModelContext.array().children(model)
      const schema = components.getSchema(arrayModel)
      expect(schema).toMatchSnapshot()
    })

    it('should reference schema from cache', () => {
      const arrayModel = defaultModelContext.array().children(model)
      const cache = new Cache()
      const arraySchema = components.getSchema(arrayModel, cache, 'Users')
      expect(arraySchema).toHaveProperty('$ref', '#/definitions/Users')
      const schema = components.getSchema(model, cache)
      expect(schema).toHaveProperty('$ref', '#/definitions/UsersItem')
    })
  })
})
