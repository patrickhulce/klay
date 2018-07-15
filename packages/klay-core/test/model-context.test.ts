const ModelContext = require('../lib/model-context').ModelContext

describe('lib/model-context.ts', () => {
  describe('#constructor', () => {
    it('creates context with default options', () => {
      const context = ModelContext.create()
      const types = context._options.types
      expect(types).toContain('any')
      expect(types).toContain('boolean')
      expect(types).toContain('string')
      expect(types).toContain('object')
    })

    it('adds builder functions', () => {
      const context = ModelContext.create()
      expect(typeof context.string).toBe('function')
      expect(typeof context.creditCard).toBe('function')
      expect(typeof context.unixTimestamp).toBe('function')
      let model = context.creditCard()
      expect(model.spec).toMatchObject({type: 'string', format: 'credit-card'})
      model = context.unixTimestamp()
      expect(model.spec).toMatchObject({type: 'date-time', format: 'unix-timestamp'})
      model = context.create({type: 'string', format: 'alphanumeric'})
      expect(model.spec).toMatchObject({type: 'string', format: 'alphanumeric'})
    })
  })

  describe('.use', () => {
    it('merges in extensions', () => {
      const context = ModelContext.create().use({types: ['foo-bar']})
      expect(context._options.types).toContain('foo-bar')
      expect(context._options.types).toContain('number')
      expect(typeof context.fooBar).toBe('function')
    })

    it('calls extendContext', () => {
      const extension = {
        type: ['super-custom'],
        extendContext(context) {
          context.superCustom = () => 1
        },
      }

      const context = ModelContext.create().use(extension)
      expect(typeof context.superCustom).toBe('function')
      expect(context.superCustom()).toBe(1)
    })

    it('does not override built-ins', () => {
      const context = ModelContext.create().use({types: ['use']})
      expect(context._options.types).toContain('use')
      const result = context.use({})
      expect(result.constructor.name).toBe('ModelContext')
    })
  })

  describe('.reset', () => {
    let context
    beforeEach(() => (context = ModelContext.create()))

    it('resets options', () => {
      context = context.use({types: ['my-type']})
      expect(context._options.types).toContain('string')
      expect(context._options.types).toContain('my-type')
      context.reset()
      expect(context._options.types).toContain('string')
      expect(context._options.types).not.toContain('my-type')
    })

    it('deletes builders', () => {
      context = context.use({types: ['my-type']})
      expect(typeof context.string).toBe('function')
      expect(typeof context.myType).toBe('function')
      context.reset()
      expect(typeof context.string).toBe('function')
      expect(typeof context.myType).not.toBe('function')
    })
  })

  describe('.create', () => {
    it('overrides defaults', () => {
      const context = ModelContext.create().use({defaults: {required: true}})
      const model = context.create({type: 'string', required: false})
      expect(model.spec).toMatchObject({type: 'string', required: false})
    })
  })
})
