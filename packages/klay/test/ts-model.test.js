const expect = require('chai').expect
const Model = require('../lib-ts/model').Model

describe('model.ts', () => {
  const defaultOptions = {
    types: ['string', 'array', 'object'],
    formats: {string: ['lowercase']},
  }

  describe('#constructor', () => {
    it('should construct a model', () => {
      expect(() => new Model({}, {types: []})).to.not.throw()
    })
  })

  describe('.type', () => {
    it('should set spec.type', () => {
      const model = new Model({}, defaultOptions).type('string')
      expect(model.spec.type).to.equal('string')
    })

    it('should throw on unacceptable type', () => {
      expect(() => new Model({}, defaultOptions).type('unknown')).to.throw()
    })
  })

  describe('.format', () => {
    it('should set spec.format', () => {
      const model = new Model({}, defaultOptions).type('string').format('lowercase')
      expect(model.spec.format).to.equal('lowercase')
    })

    it('should throw on format without type', () => {
      expect(() => new Model({}, defaultOptions).format('string')).to.throw(/type must be set/)
    })

    it('should throw on unacceptable format', () => {
      expect(() => new Model({}, defaultOptions).type('string').format('unknown')).to.throw()
    })
  })

  describe('.required', () => {
    it('should implicitly set spec.required', () => {
      const model = new Model({}, defaultOptions).required()
      expect(model.spec.required).to.equal(true)
    })

    it('should explicitly set spec.required', () => {
      const model = new Model({}, defaultOptions).required(false)
      expect(model.spec.required).to.equal(false)
    })

    it('should throw on incorrect type', () => {
      expect(() => new Model({}, defaultOptions).required('string')).to.throw()
    })
  })

  describe('.optional', () => {
    it('should implicitly set spec.optional', () => {
      const model = new Model({}, defaultOptions).optional()
      expect(model.spec.required).to.equal(false)
    })

    it('should explicitly set spec.optional', () => {
      const model = new Model({}, defaultOptions).optional(false)
      expect(model.spec.required).to.equal(true)
    })

    it('should throw on incorrect type', () => {
      expect(() => new Model({}, defaultOptions).optional('string')).to.throw()
    })
  })

  describe('.nullable', () => {
    it('should implicitly set spec.nullable', () => {
      const model = new Model({}, defaultOptions).nullable()
      expect(model.spec.nullable).to.equal(true)
    })

    it('should explicitly set spec.nullable', () => {
      const model = new Model({}, defaultOptions).nullable(false)
      expect(model.spec.nullable).to.equal(false)
    })

    it('should throw on incorrect type', () => {
      expect(() => new Model({}, defaultOptions).nullable('string')).to.throw()
    })
  })

  describe('.strict', () => {
    it('should implicitly set spec.strict', () => {
      const model = new Model({}, defaultOptions).strict()
      expect(model.spec.strict).to.equal(true)
    })

    it('should explicitly set spec.strict', () => {
      const model = new Model({}, defaultOptions).strict(false)
      expect(model.spec.strict).to.equal(false)
    })

    it('should throw on incorrect type', () => {
      expect(() => new Model({}, defaultOptions).strict('string')).to.throw()
    })
  })

  describe('.default', () => {
    it('should set default', () => {
      const model = new Model({}, defaultOptions).default(10)
      expect(model.spec.default).to.equal(10)
    })
  })

  describe('.options', () => {
    it('should set options', () => {
      const model = new Model({}, defaultOptions).options([1, 2])
      expect(model.spec.options).to.eql([1, 2])
    })

    it('should throw when type does not match', () => {
      const model = new Model({}, defaultOptions).type('string')
      expect(() => model.options([1, 2])).to.throw()
    })
  })

  describe('.children', () => {
    it('should set children when type is array', () => {
      const childModel = new Model({}, defaultOptions).type('string')
      const model = new Model({}, defaultOptions).type('array').children(childModel)
      expect(model.spec.children).to.equal(childModel)
    })

    it('should set children when type is object', () => {
      const childModel = new Model({}, defaultOptions).type('string')
      const model = new Model({}, defaultOptions).type('object').children({id: childModel})
      expect(model.spec.children).to.eql([{path: 'id', model: childModel}])
    })

    it('should throw when type is array and input is not valid', () => {
      const childModel = new Model({}, defaultOptions).type('string')
      const model = new Model({}, defaultOptions).type('array')
      expect(() => model.children({id: childModel})).to.throw()
    })

    it('should throw when type is object and input is not valid', () => {
      const childModel = new Model({}, defaultOptions).type('string')
      const model = new Model({}, defaultOptions).type('object')
      expect(() => model.children({id: 123})).to.throw()
      expect(() => model.children([{path: '1', model: 123}])).to.throw()
      expect(() => model.children(childModel)).to.throw()
    })
  })

  describe('.pick', () => {
    it('should set options', () => {
      const childModel = new Model({}, defaultOptions).type('string')
      const model = new Model({}, defaultOptions).type('object').children({
        id: childModel,
        name: childModel,
        user: childModel,
      })

      model.pick(['id', 'user'])
      expect(model.spec.children).to.eql([
        {path: 'id', model: childModel},
        {path: 'user', model: childModel},
      ])
    })

    it('should throw when type does not match', () => {
      const childModel = new Model({}, defaultOptions).type('string')
      const model = new Model({}, defaultOptions).type('array').children(childModel)
      expect(() => model.pick(['foo'])).to.throw()
    })

    it('should throw when no children available', () => {
      const model = new Model({}, defaultOptions).type('object')
      expect(() => model.pick(['foo'])).to.throw()
    })
  })

  describe('.omit', () => {
    it('should set options', () => {
      const childModel = new Model({}, defaultOptions).type('string')
      const model = new Model({}, defaultOptions).type('object').children({
        id: childModel,
        name: childModel,
        user: childModel,
      })

      model.omit(['id', 'user'])
      expect(model.spec.children).to.eql([
        {path: 'name', model: childModel},
      ])
    })

    it('should throw when type does not match', () => {
      const childModel = new Model({}, defaultOptions).type('string')
      const model = new Model({}, defaultOptions).type('array').children(childModel)
      expect(() => model.omit(['foo'])).to.throw()
    })

    it('should throw when no children available', () => {
      const model = new Model({}, defaultOptions).type('object')
      expect(() => model.omit(['foo'])).to.throw()
    })
  })
})
