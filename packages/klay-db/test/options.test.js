const Options = require('../dist/options').DatabaseOptions

describe('lib/options.ts', () => {
  let validationResult, setValue

  beforeEach(() => {
    setValue = jest.fn()
    validationResult = {setValue}
  })

  describe('#constructor', () => {
    it('should set spec properties', () => {
      const opts = new Options({index: [{property: 'foo', direction: 'asc'}]})
      expect(opts).toBeInstanceOf(Options)
      expect(opts).toHaveProperty('spec.index.0.property', 'foo')
    })
  })

  describe('.automanage', () => {
    let opts

    beforeEach(() => {
      opts = new Options()
    })

    it('should add the first automanaged property', () => {
      const supplyWith = () => new Date()
      opts = opts.automanage({
        property: ['myprop'],
        event: 'create',
        phase: 'validate-value',
        supplyWith,
      })

      expect(opts.spec).toHaveProperty('automanage', [
        {
          property: ['myprop'],
          event: 'create',
          phase: 'validate-value',
          supplyWith,
        },
      ])
    })

    it('should add the second automanaged property', () => {
      const supplyWith = () => new Date()
      opts = opts
        .automanage({
          property: ['mypropA'],
          event: 'create',
          phase: 'validate-value',
          supplyWith: () => 1,
        })
        .automanage({
          property: ['mypropB'],
          event: 'update',
          phase: 'parse',
          supplyWith,
        })

      expect(opts.spec).toHaveProperty('automanage.1', {
        property: ['mypropB'],
        event: 'update',
        phase: 'parse',
        supplyWith,
      })
    })

    it('should fill default property and phase', () => {
      opts = opts.automanage({event: 'create', supplyWith: 'date'})
      expect(opts.spec.automanage[0]).toMatchObject({phase: 'parse', property: []})
    })

    it('should support auto-increment supplyWith', () => {
      opts = opts.automanage({
        property: ['mypropA'],
        event: 'create',
        phase: 'database',
        supplyWith: 'auto-increment',
      })

      expect(opts.spec).toHaveProperty('automanage.0', {
        property: ['mypropA'],
        event: 'create',
        phase: 'database',
        supplyWith: 'auto-increment',
      })
    })

    it('should support date supplyWith', () => {
      opts = opts.automanage({event: 'create', supplyWith: 'date'})

      expect(typeof opts.spec.automanage[0].supplyWith).toBe('function')
      opts.spec.automanage[0].supplyWith(validationResult)
      expect(setValue.mock.calls[0][0]).toBeInstanceOf(Date)
    })

    it('should support isotimestamp supplyWith', () => {
      opts = opts.automanage({event: 'create', supplyWith: 'iso-timestamp'})

      expect(typeof opts.spec.automanage[0].supplyWith).toBe('function')
      opts.spec.automanage[0].supplyWith(validationResult)
      expect(setValue.mock.calls[0][0]).toMatch(/^\d{4}-\d{2}-\d{2}/)
    })

    it('should fail when given invalid input', () => {
      const valid = {property: [], event: '*', phase: 'database', supplyWith: () => 1}
      expect(() => opts.automanage('old')).toThrowError()
      expect(() => opts.automanage({...valid, property: 'foo'})).toThrowError(/property/)
      expect(() => opts.automanage({...valid, event: '1'})).toThrowError(/event/)
      expect(() => opts.automanage({...valid, phase: '2'})).toThrowError(/phase/)
      expect(() => opts.automanage({...valid, supplyWith: '3'})).toThrowError(/supplyWith/)
    })
  })

  describe('.constrain', () => {
    let opts

    beforeEach(() => {
      opts = new Options()
    })

    it('should add the first constrain property', () => {
      opts = opts.constrain({properties: [['id']], type: 'primary'})

      expect(opts.spec).toHaveProperty('constrain', [
        {
          name: 'primary:id',
          properties: [['id']],
          type: 'primary',
          meta: {},
        },
      ])
    })

    it('should add the second constrain property', () => {
      opts = opts
        .constrain({properties: [['id']], type: 'primary'})
        .constrain({properties: [['day'], ['other']], type: 'unique', meta: {behavior: 'reject'}})

      expect(opts.spec).toHaveProperty('constrain.1', {
        name: 'unique:day,other',
        properties: [['day'], ['other']],
        type: 'unique',
        meta: {behavior: 'reject'},
      })
    })

    it('should default properties, meta, and name', () => {
      opts = opts.constrain({type: 'primary'})
      expect(opts.spec.constrain[0]).toMatchObject({
        name: 'primary:',
        properties: [[]],
        meta: {},
      })
    })

    it('should add a reference constrain property', () => {
      const meta = {referencedModel: 'parents', name: 'reference:parent'}
      opts = opts.constrain({properties: [['id']], type: 'primary'}).constrain({
        properties: [['parent_id']],
        type: 'reference',
        meta,
      })

      expect(opts.spec).toHaveProperty('constrain.1', {
        name: 'reference:parent',
        properties: [['parent_id']],
        type: 'reference',
        meta,
      })
    })

    it('should add an immutable constrain property', () => {
      opts = opts
        .constrain({properties: [['id']], type: 'primary'})
        .constrain({properties: [['canonical_id'], ['created_on']], type: 'immutable'})

      expect(opts.spec).toHaveProperty('constrain.1', {
        name: 'immutable:canonical_id,created_on',
        properties: [['canonical_id'], ['created_on']],
        type: 'immutable',
        meta: {},
      })
    })

    it('should add a custom constrain property', () => {
      opts = opts.constrain({
        properties: [['something'], ['other']],
        type: 'custom',
        meta: {foo: 'bar'},
      })

      expect(opts.spec).toHaveProperty('constrain.0', {
        name: 'custom:something,other',
        properties: [['something'], ['other']],
        type: 'custom',
        meta: {foo: 'bar'},
      })
    })

    it('should use meta.name when set', () => {
      opts = opts.constrain({properties: [['id']], type: 'primary', meta: {name: 'foo'}})
      expect(opts.spec).toHaveProperty('constrain.0.name', 'foo')
    })

    it('should throw when given empty properties', () => {
      const constrain = {properties: [], type: 'primary'}
      expect(() => opts.constrain(constrain)).toThrowError(/at least 1 property/)
    })
  })

  describe('.index', () => {
    let opts

    beforeEach(() => {
      opts = new Options()
    })

    it('should add the first index', () => {
      opts = opts.index([{property: ['myprop'], direction: 'desc'}])
      expect(opts.spec).toHaveProperty('index', [[{property: ['myprop'], direction: 'desc'}]])
    })

    it('should add the second index', () => {
      opts = opts.index([['myprop']]).index([['otherprop'], ['second']])

      expect(opts.spec).toHaveProperty('index.1', [
        {property: ['otherprop'], direction: 'asc'},
        {property: ['second'], direction: 'asc'},
      ])
    })

    it('should add a mixed index', () => {
      opts = opts.index([['some'], {property: ['foo'], direction: 'desc'}])
      expect(opts.spec).toHaveProperty('index.0', [
        {property: ['some'], direction: 'asc'},
        {property: ['foo'], direction: 'desc'},
      ])
    })

    it('should throw when given empty properties', () => {
      expect(() => opts.index([])).toThrowError(/at least 1 property/)
    })
  })

  describe('#merge', () => {
    it('should merge specs', () => {
      const optsA = new Options()
        .automanage({
          property: ['x'],
          event: 'create',
          phase: 'validate-value',
          supplyWith: 'date',
        })
        .constrain({properties: [['y']], type: 'primary'})
        .index([['z']])
      const optsB = new Options()
        .automanage({
          property: ['w'],
          event: 'create',
          phase: 'validate-value',
          supplyWith: 'iso-timestamp',
        })
        .constrain({properties: [['z']], type: 'unique'})
        .index([['w']])

      const merged = Options.merge(optsA.spec, optsB.spec)
      expect(merged.automanage).toHaveLength(2)
      expect(merged.constrain).toHaveLength(2)
      expect(merged.index).toHaveLength(2)
    })

    it('should de-dupe automanage', () => {
      const optsA = new Options().automanage({
        property: ['x'],
        event: 'create',
        phase: 'validate-value',
        supplyWith: 'date',
      })
      const optsB = new Options().automanage({
        property: ['x'],
        event: 'create',
        phase: 'validate-value',
        supplyWith: 'date',
      })

      const merged = Options.merge(optsA.spec, optsB.spec)
      expect(merged.automanage).toHaveLength(1)
    })

    it('should de-dupe indexes', () => {
      const indexA = [{property: ['x'], direction: 'asc'}, {property: ['y'], direction: 'desc'}]
      const indexB = [{property: ['z', 'x'], direction: 'asc'}]
      const indexC = [{property: ['w'], direction: 'desc'}]
      const specA = {index: [indexA, indexB]}
      const specB = {index: [indexB, indexC]}
      const merged = Options.merge(specA, specB)
      expect(merged.index).toEqual([indexA, indexB, indexC])
    })
  })
})
