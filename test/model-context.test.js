const expect = require('chai').expect
const ModelContext = require('../lib-ts/model-context').ModelContext

describe('lib/model-context.ts', () => {
  describe('#constructor', () => {
    it('creates context with default options', () => {
      const context = new ModelContext()
      const types = context._options.types
      expect(types).to.eql(['any', 'boolean', 'number', 'string', 'array', 'object', 'date'])
    })
  })

  describe('.use', () => {
    it('merges in extensions', () => {
      const context = new ModelContext().use({types: ['foobar']})
      expect(context._options.types).to.include('foobar')
      expect(context._options.types).to.include('number')
    })
  })

  describe('.create', () => {
    const context = new ModelContext()

    it('creates a model', () => {
      const model = context.create().type('string')
      expect(model.constructor.name).to.equal('Model')
      expect(model.spec).to.have.property('type', 'string')
    })
  })
})
