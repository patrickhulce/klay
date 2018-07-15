const Model = require('../lib/model').Model

describe('lib/model.ts', () => {
  const defaultOptions = {
    types: ['number', 'string', 'array', 'object'],
    formats: {string: ['lowercase']},
  }

  describe('#constructor', () => {
    it('should construct a model', () => {
      expect(() => new Model({}, {types: []})).not.toThrowError()
    })

    it('should use the defaults provided', () => {
      const options = {...defaultOptions, defaults: {required: true, type: 'string'}}
      const model = new Model({type: 'number'}, options)
      expect(model.spec).toEqual({required: true, type: 'number'})
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
      expect(typeof model.foo).toBe('function')
      expect(model.foo(1, 2, 'woot')).toBe('return value')
      expect(fooArgs).toEqual([[model, 1, 2, 'woot']])
    })

    it('should validate the spec', () => {
      const methods = {
        foo(model, x) {
          if (x < 5) {
            throw new Error('too low')
          }
          model.spec.foo = x
          return 'return value'
        },
      }

      const options = {types: ['string'], methods}
      const model = new Model({foo: 10, type: 'string', extra: 1}, options)
      expect(model.spec).toEqual({foo: 10, type: 'string', extra: 1})
      expect(() => new Model({type: 'foo'}, options)).toThrowError(/type.*one of/)
      expect(() => new Model({foo: 2}, options)).toThrowError(/too low/)
    })

    it('should run hooks', () => {
      const hooks = {construction: [model => (model.spec.foo = 'bar')]}
      const options = {...defaultOptions, hooks}
      const model = new Model({}, options)
      expect(model.spec.foo).toEqual('bar')
    })
  })

  describe('.reset', () => {
    it('should clear out the spec', () => {
      const model = new Model({type: 'string'}, defaultOptions)
      expect(model.spec).toEqual({type: 'string'})
      model.reset()
      expect(model.spec).toEqual({})
    })
  })

  describe('.clone', () => {
    it('should create a copy', () => {
      const modelA = new Model({}, defaultOptions).type('string')
      const modelB = modelA.clone().type('number')
      expect(modelA.spec).toEqual({type: 'string'})
      expect(modelB.spec).toEqual({type: 'number'})
    })

    it('should deep copy children', () => {
      const child = new Model({}, defaultOptions).type('string')
      const model = new Model({}, defaultOptions).type('object').children({id: child})
      const clone = model.clone()
      clone.spec.children[0].model.type('number')
      expect(model.spec.children[0].model).not.toBe(clone.spec.children[0].model)
      expect(model.spec.children[0].model.spec).toEqual({type: 'string'})
      expect(clone.spec.children[0].model.spec).toEqual({type: 'number'})
    })

    it('should deep copy enum', () => {
      const child = new Model({}, defaultOptions).type('string')
      const model = new Model({}, defaultOptions).type('object').enum([child])
      const clone = model.clone()
      clone.spec.enum[0].type('number')
      expect(model.spec.enum[0]).not.toBe(clone.spec.enum[0])
      expect(model.spec.enum[0].spec).toEqual({type: 'string'})
      expect(clone.spec.enum[0].spec).toEqual({type: 'number'})
    })
  })

  describe('.type', () => {
    it('should set spec.type', () => {
      const model = new Model({}, defaultOptions).type('string')
      expect(model.spec.type).toBe('string')
    })

    it('should throw on unacceptable type', () => {
      expect(() => new Model({}, defaultOptions).type('unknown')).toThrowError()
    })
  })

  describe('.format', () => {
    it('should set spec.format', () => {
      const model = new Model({}, defaultOptions).type('string').format('lowercase')
      expect(model.spec.format).toBe('lowercase')
    })

    it('should throw on format without type', () => {
      expect(() => new Model({}, defaultOptions).format('string')).toThrowError(/type must be set/)
    })

    it('should throw on unacceptable format', () => {
      expect(() => new Model({}, defaultOptions).type('string').format('unknown')).toThrowError(
        /expected format.*to be/,
      )
    })
  })

  describe('.required', () => {
    it('should implicitly set spec.required', () => {
      const model = new Model({}, defaultOptions).required()
      expect(model.spec.required).toBe(true)
    })

    it('should explicitly set spec.required', () => {
      const model = new Model({}, defaultOptions).required(false)
      expect(model.spec.required).toBe(false)
    })

    it('should throw on incorrect type', () => {
      expect(() => new Model({}, defaultOptions).required('string')).toThrowError()
    })
  })

  describe('.optional', () => {
    it('should implicitly set spec.optional', () => {
      const model = new Model({}, defaultOptions).optional()
      expect(model.spec.required).toBe(false)
    })

    it('should explicitly set spec.optional', () => {
      const model = new Model({}, defaultOptions).optional(false)
      expect(model.spec.required).toBe(true)
    })

    it('should throw on incorrect type', () => {
      expect(() => new Model({}, defaultOptions).optional('string')).toThrowError()
    })
  })

  describe('.nullable', () => {
    it('should implicitly set spec.nullable', () => {
      const model = new Model({}, defaultOptions).nullable()
      expect(model.spec.nullable).toBe(true)
    })

    it('should explicitly set spec.nullable', () => {
      const model = new Model({}, defaultOptions).nullable(false)
      expect(model.spec.nullable).toBe(false)
    })

    it('should throw on incorrect type', () => {
      expect(() => new Model({}, defaultOptions).nullable('string')).toThrowError()
    })
  })

  describe('.strict', () => {
    it('should implicitly set spec.strict', () => {
      const model = new Model({}, defaultOptions).strict()
      expect(model.spec.strict).toBe(true)
    })

    it('should explicitly set spec.strict', () => {
      const model = new Model({}, defaultOptions).strict(false)
      expect(model.spec.strict).toBe(false)
    })

    it('should throw on incorrect type', () => {
      expect(() => new Model({}, defaultOptions).strict('string')).toThrowError()
    })
  })

  describe('.default', () => {
    it('should set default', () => {
      const model = new Model({}, defaultOptions).default(10)
      expect(model.spec.default).toBe(10)
    })
  })

  describe('.min', () => {
    it('should set min', () => {
      const model = new Model({}, defaultOptions).min(2)
      expect(model).toHaveProperty('spec.min', 2)
    })

    it('should set date min', () => {
      const date = new Date(2018, 1, 1)
      const model = new Model({}, defaultOptions).min(date)
      expect(model).toHaveProperty('spec.min', date.getTime())
    })
  })

  describe('.max', () => {
    it('should set max', () => {
      const model = new Model({}, defaultOptions).max(2)
      expect(model).toHaveProperty('spec.max', 2)
    })

    it('should set date max', () => {
      const date = new Date(2018, 1, 1)
      const model = new Model({}, defaultOptions).max(date)
      expect(model).toHaveProperty('spec.max', date.getTime())
    })
  })

  describe('.size', () => {
    it('should set size', () => {
      const model = new Model({}, defaultOptions).size(2)
      expect(model).toHaveProperty('spec.min', 2)
      expect(model).toHaveProperty('spec.max', 2)
    })
  })

  describe('.enum', () => {
    it('should set enum when simple types', () => {
      const model = new Model({}, defaultOptions).enum([1, 2])
      expect(model.spec.enum).toEqual([1, 2])
    })

    it('should set enum when models', () => {
      const optionA = new Model({}, defaultOptions).type('string')
      const optionB = new Model({}, defaultOptions).type('number')
      const model = new Model({}, defaultOptions).enum([optionA, optionB])
      expect(model.spec.enum).toEqual([optionA, optionB])
    })

    it('should throw when non-model', () => {
      const model = new Model({}, defaultOptions)
      expect(() => model.enum([1, {}])).toThrowError(/expected.*typeof number/)
      expect(() => model.enum(['', 1])).toThrowError(/expected.*typeof string/)
    })
  })

  describe('.children', () => {
    it('should set children when type is array', () => {
      const childModel = new Model({}, defaultOptions).type('string')
      const model = new Model({}, defaultOptions).type('array').children(childModel)
      expect(model.spec.children).toBe(childModel)
    })

    it('should set children when type is object', () => {
      const childModel = new Model({}, defaultOptions).type('string')
      const model = new Model({}, defaultOptions).type('object').children({id: childModel})
      expect(model.spec.children).toEqual([{path: 'id', model: childModel}])
    })

    it('should run hooks when array', () => {
      const childModel = new Model({}, defaultOptions).type('string')
      const hooks = {'set-children': [model => (model.spec.foo = 'bar')]}
      const options = {...defaultOptions, hooks}

      let model = new Model({}, options).type('array')
      expect(model.spec.foo).toEqual(undefined)
      model = model.children(childModel)
      expect(model.spec.foo).toEqual('bar')
    })

    it('should run hooks when object', () => {
      const childModel = new Model({}, defaultOptions).type('string')
      const hooks = {'set-children': [model => (model.spec.foo = 'bar')]}
      const options = {...defaultOptions, hooks}

      let model = new Model({}, options).type('object')
      expect(model.spec.foo).toEqual(undefined)
      model = model.children({thing: childModel})
      expect(model.spec.foo).toEqual('bar')
    })

    it('should throw when type is array and input is not valid', () => {
      const childModel = new Model({}, defaultOptions).type('string')
      const model = new Model({}, defaultOptions).type('array')
      expect(() => model.children({id: childModel})).toThrowError()
    })

    it('should throw when type is object and input is not valid', () => {
      const childModel = new Model({}, defaultOptions).type('string')
      const model = new Model({}, defaultOptions).type('object')
      expect(() => model.children({id: 123})).toThrowError()
      expect(() => model.children([{path: '1', model: 123}])).toThrowError()
      expect(() => model.children(childModel)).toThrowError()
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
      expect(model.spec.children).toEqual([
        {path: 'id', model: childModel},
        {path: 'user', model: childModel},
      ])
    })

    it('should throw when type does not match', () => {
      const childModel = new Model({}, defaultOptions).type('string')
      const model = new Model({}, defaultOptions).type('array').children(childModel)
      expect(() => model.pick(['foo'])).toThrowError()
    })

    it('should throw when no children available', () => {
      const model = new Model({}, defaultOptions).type('object')
      expect(() => model.pick(['foo'])).toThrowError()
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
      expect(model.spec.children).toEqual([{path: 'name', model: childModel}])
    })

    it('should throw when type does not match', () => {
      const childModel = new Model({}, defaultOptions).type('string')
      const model = new Model({}, defaultOptions).type('array').children(childModel)
      expect(() => model.omit(['foo'])).toThrowError()
    })

    it('should throw when no children available', () => {
      const model = new Model({}, defaultOptions).type('object')
      expect(() => model.omit(['foo'])).toThrowError()
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
      expect(modelA.spec.children).toEqual([
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
      expect(() => modelA.merge(modelB)).toThrowError()
    })

    it('should not merge with invalid input', () => {
      const childModel = {id: new Model({}, defaultOptions)}
      const model = new Model({}, defaultOptions).type('object').children(childModel)
      expect(() => model.merge(1)).toThrowError()
      expect(() => model.merge({})).toThrowError()
      expect(() => model.merge()).toThrowError()
      expect(() => model.merge(childModel.id)).toThrowError()
      expect(() => childModel.id.merge(model)).toThrowError()
    })

    it('should not fail when no children exist', () => {
      const modelA = new Model({}, defaultOptions).type('object')
      const modelB = new Model({}, defaultOptions).type('object')
      expect(() => modelA.merge(modelB)).not.toThrowError()
    })
  })

  describe('.coerce', () => {
    it('should set coerce', () => {
      const coerce = () => {}
      const model = new Model({}, defaultOptions).coerce(coerce, 'parse')
      expect(model.spec.coerce).toEqual({parse: coerce})
      model.coerce(coerce, 'coerce-type')
      expect(model.spec.coerce).toEqual({parse: coerce, 'coerce-type': coerce})
      model.coerce({'coerce-type': coerce})
      expect(model.spec.coerce).toEqual({'coerce-type': coerce})
      model.coerce({})
      expect(model.spec.coerce).toEqual({})
      model.coerce(coerce)
      expect(model.spec.coerce).toEqual({parse: coerce})
    })

    it('should throw when invalid', () => {
      const model = new Model({}, defaultOptions)
      expect(() => model.coerce(1)).toThrowError()
      expect(() => model.coerce('foo')).toThrowError()
      expect(() => model.coerce(() => {}, 'foo')).toThrowError()
      expect(() => model.coerce({foo: 'bar'})).toThrowError()
      expect(() => model.coerce({preextract: () => {}})).toThrowError()
    })
  })

  describe('.validations', () => {
    it('should set validations', () => {
      const validationA = () => {}
      const validationB = /regex/
      const model = new Model({}, defaultOptions).validations([validationA, validationB])
      expect(model.spec.validations).toEqual([validationA, validationB])
    })

    it('should override existing validations', () => {
      const validationA = () => {}
      const validationB = () => {}
      const model = new Model({}, defaultOptions).validations([validationA, validationB])
      model.validations([validationA])
      expect(model.spec.validations).toEqual([validationA])
    })

    it('should add to existing violations', () => {
      const validationA = () => {}
      const validationB = /regexp/
      const validationC = () => {}
      const model = new Model({}, defaultOptions).validations([validationA, validationB])
      model.validations(validationC)
      expect(model.spec.validations).toEqual([validationA, validationB, validationC])
    })

    it('should throw when invalid', () => {
      const model = new Model({}, defaultOptions)
      expect(() => model.validations(1)).toThrowError()
      expect(() => model.validations('foo')).toThrowError()
      expect(() => model.validations({})).toThrowError()
      expect(() => model.validations([() => {}, 'foo'])).toThrowError()
      expect(() => model.validations([/foo/, {}])).toThrowError()
    })
  })

  describe('.validate', () => {
    it('should validate value', () => {
      const model = new Model({}, defaultOptions).required()
      expect(model.validate(undefined).toJSON()).toEqual({
        conforms: false,
        value: undefined,
        errors: [{message: 'expected value to be defined'}],
      })
    })
  })
})
