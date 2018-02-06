const expect = require('chai').expect
const ModelContext = require('../lib-ts/model-context').ModelContext

describe('lib/model-context.ts', () => {
  describe('#constructor', () => {
    it('creates context with default options', () => {
      const context = new ModelContext()
      const types = context._options.types
      expect(types).to.eql(['any', 'boolean', 'number', 'string', 'array', 'object', 'date'])
    })

    it('adds builder functions', () => {
      const context = new ModelContext()
      expect(context.string).to.be.a('function')
      expect(context.creditCard).to.be.a('function')
      expect(context.unixTimestamp).to.be.a('function')
      let model = context.creditCard()
      expect(model.spec).to.include({type: 'string', format: 'credit-card'})
      model = context.unixTimestamp()
      expect(model.spec).to.include({type: 'date', format: 'unix-timestamp'})
    })
  })

  describe('.use', () => {
    it('merges in extensions', () => {
      const context = new ModelContext().use({types: ['foo-bar']})
      expect(context._options.types).to.include('foo-bar')
      expect(context._options.types).to.include('number')
      expect(context.fooBar).to.be.a('function')
    })

    it('does not override built-ins', () => {
      const context = new ModelContext().use({types: ['use']})
      expect(context._options.types).to.include('use')
      const result = context.use({})
      expect(result.constructor.name).to.equal('ModelContext')
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

  describe('.reset', () => {
    let context
    beforeEach(() => context = new ModelContext())

    it('resets options', () => {
      context = context.use({types: ['my-type']})
      expect(context._options.types).to.include('string')
      expect(context._options.types).to.include('my-type')
      context.reset()
      expect(context._options.types).to.include('string')
      expect(context._options.types).to.not.include('my-type')
    })

    it('deletes builders', () => {
      context = context.use({types: ['my-type']})
      expect(context.string).to.be.a('function')
      expect(context.myType).to.be.a('function')
      context.reset()
      expect(context.string).to.be.a('function')
      expect(context.myType).to.not.be.a('function')
    })
  })
})
