const expect = require('chai').expect
const Model = require('../lib-ts/model').Model

describe('model.ts', () => {
  const defaultOptions = {
    types: ['number', 'string', 'array', 'object'],
    formats: {string: ['lowercase']},
  }

  describe('#constructor', () => {
    it('should construct a model', () => {
      expect(() => new Model({}, {types: []})).to.not.throw()
    })

    it('should use the defaults provided', () => {
      const options = {...defaultOptions, defaults: {required: true, type: 'string'}}
      const model = new Model({type: 'number'}, options)
      expect(model.spec).to.eql({required: true, type: 'number'})
    })

    it('should add methods to model', () => {
      const fooArgs = []
      const methods = {
        foo(...args) {
          fooArgs.push(args)
          return 'return value'
        },
      }

      const options = {types: ['string'], methods}
      const model = new Model({}, options).type('string')
      expect(model.foo).to.be.a('function')
      expect(model.foo(1, 2, 'woot')).to.equal('return value')
      expect(fooArgs).to.eql([[model, 1, 2, 'woot']])
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
      expect(() => new Model({}, defaultOptions).type('string').format('unknown')).to.throw(
        /expected format.*to be/
      )
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

  describe('.min', () => {
    it('should set min', () => {
      const model = new Model({}, defaultOptions).min(2)
      expect(model).to.have.nested.property('spec.min', 2)
    })

    it('should set date min', () => {
      const date = new Date(2018, 1, 1)
      const model = new Model({}, defaultOptions).min(date)
      expect(model).to.have.nested.property('spec.min', date.getTime())
    })
  })

  describe('.max', () => {
    it('should set max', () => {
      const model = new Model({}, defaultOptions).max(2)
      expect(model).to.have.nested.property('spec.max', 2)
    })

    it('should set date max', () => {
      const date = new Date(2018, 1, 1)
      const model = new Model({}, defaultOptions).max(date)
      expect(model).to.have.nested.property('spec.max', date.getTime())
    })
  })

  describe('.size', () => {
    it('should set size', () => {
      const model = new Model({}, defaultOptions).size(2)
      expect(model).to.have.nested.property('spec.min', 2)
      expect(model).to.have.nested.property('spec.max', 2)
    })
  })

  describe('.enum', () => {
    it('should set enum when simple types', () => {
      const model = new Model({}, defaultOptions).enum([1, 2])
      expect(model.spec.enum).to.eql([{option: 1}, {option: 2}])
    })

    it('should set enum when models', () => {
      const optionA = new Model({}, defaultOptions).type('string')
      const optionB = new Model({}, defaultOptions).type('number')
      const model = new Model({}, defaultOptions).enum([optionA, optionB])
      const options = [{option: optionA}, {option: optionB}]
      expect(model.spec.enum).to.eql(options)
    })

    it('should set enum when model with applies', () => {
      const optionA = new Model({}, defaultOptions).type('string')
      const optionB = new Model({}, defaultOptions).type('number')
      const options = [
        {option: optionA},
        {option: optionB, applies: () => true},
      ]
      const model = new Model({}, defaultOptions).enum(options)
      expect(model.spec.enum).to.eql(options)
    })

    it('should throw when non-model', () => {
      const model = new Model({}, defaultOptions)
      expect(() => model.enum([1, {}])).to.throw()
    })

    it('should throw when applies is non-function', () => {
      const model = new Model({}, defaultOptions)
      expect(() => model.enum([1, {option: 1, applies: true}])).to.throw()
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
      expect(model.spec.children).to.eql([{path: 'name', model: childModel}])
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

  describe('.merge', () => {
    it('should merge two models', () => {
      const modelAChildren = {
        first: new Model({}, defaultOptions),
        second: new Model({}, defaultOptions),
      }
      const modelBChildren = {
        third: new Model({}, defaultOptions),
        fourth: new Model({}, defaultOptions),
      }

      const modelA = new Model({}, defaultOptions).type('object').children(modelAChildren)
      const modelB = new Model({}, defaultOptions).type('object').children(modelBChildren)
      modelA.merge(modelB)
      expect(modelA.spec.children).to.eql([
        {path: 'first', model: modelAChildren.first},
        {path: 'second', model: modelAChildren.second},
        {path: 'third', model: modelBChildren.third},
        {path: 'fourth', model: modelBChildren.fourth},
      ])
    })

    it('should not merge two conflicting models', () => {
      const modelAChildren = {
        first: new Model({}, defaultOptions),
        second: new Model({}, defaultOptions),
      }
      const modelBChildren = {
        second: new Model({}, defaultOptions),
        fourth: new Model({}, defaultOptions),
      }

      const modelA = new Model({}, defaultOptions).type('object').children(modelAChildren)
      const modelB = new Model({}, defaultOptions).type('object').children(modelBChildren)
      expect(() => modelA.merge(modelB)).to.throw()
    })

    it('should not merge with invalid input', () => {
      const childModel = {id: new Model({}, defaultOptions)}
      const model = new Model({}, defaultOptions).type('object').children(childModel)
      expect(() => model.merge(1)).to.throw()
      expect(() => model.merge({})).to.throw()
      expect(() => model.merge()).to.throw()
      expect(() => model.merge(childModel.id)).to.throw()
      expect(() => childModel.id.merge(model)).to.throw()
    })

    it('should not fail when no children exist', () => {
      const modelA = new Model({}, defaultOptions).type('object')
      const modelB = new Model({}, defaultOptions).type('object')
      expect(() => modelA.merge(modelB)).to.not.throw()
    })
  })

  describe('.coerce', () => {
    it('should set coerce', () => {
      const coerce = () => {}
      const model = new Model({}, defaultOptions).coerce(coerce, 'parse')
      expect(model.spec.coerce).to.eql({parse: coerce})
      model.coerce(coerce, 'coerce-type')
      expect(model.spec.coerce).to.eql({'parse': coerce, 'coerce-type': coerce})
      model.coerce({'coerce-type': coerce})
      expect(model.spec.coerce).to.eql({'coerce-type': coerce})
      model.coerce({})
      expect(model.spec.coerce).to.eql({})
      model.coerce(coerce)
      expect(model.spec.coerce).to.eql({parse: coerce})
    })

    it('should throw when invalid', () => {
      const model = new Model({}, defaultOptions)
      expect(() => model.coerce(1)).to.throw()
      expect(() => model.coerce('foo')).to.throw()
      expect(() => model.coerce(() => {}, 'foo')).to.throw()
      expect(() => model.coerce({foo: 'bar'})).to.throw()
      expect(() => model.coerce({preextract: () => {}})).to.throw()
    })
  })

  describe('.validations', () => {
    it('should set validations', () => {
      const validationA = () => {}
      const validationB = /regex/
      const model = new Model({}, defaultOptions).validations([validationA, validationB])
      expect(model.spec.validations).to.eql([validationA, validationB])
    })

    it('should override existing validations', () => {
      const validationA = () => {}
      const validationB = () => {}
      const model = new Model({}, defaultOptions).validations([validationA, validationB])
      model.validations([validationA])
      expect(model.spec.validations).to.eql([validationA])
    })

    it('should add to existing violations', () => {
      const validationA = () => {}
      const validationB = /regexp/
      const validationC = () => {}
      const model = new Model({}, defaultOptions).validations([validationA, validationB])
      model.validations(validationC)
      expect(model.spec.validations).to.eql([validationA, validationB, validationC])
    })

    it('should throw when invalid', () => {
      const model = new Model({}, defaultOptions)
      expect(() => model.validations(1)).to.throw()
      expect(() => model.validations('foo')).to.throw()
      expect(() => model.validations({})).to.throw()
      expect(() => model.validations([() => {}, 'foo'])).to.throw()
      expect(() => model.validations([/foo/, {}])).to.throw()
    })
  })

  describe('.validate', () => {
    it('should validate value', () => {
      const model = new Model({}, defaultOptions).required()
      expect(model.validate(undefined)).to.eql({
        conforms: false,
        value: undefined,
        errors: [{message: 'expected value to be defined'}],
      })
    })
  })
})
