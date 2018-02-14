const expect = require('chai').expect
const sinon = require('sinon')
const Options = require('../lib-ts/options').DatabaseOptions

describe.only('lib-ts/options.ts', () => {
  let validationResult, setValue

  beforeEach(() => {
    setValue = sinon.stub()
    validationResult = {setValue}
  })

  describe('#constructor', () => {
    it('should set spec properties', () => {
      const opts = new Options({index: [{property: 'foo', direction: 'asc'}]})
      expect(opts).to.be.instanceof(Options)
      expect(opts).to.have.nested.property('spec.index.0.property', 'foo')
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

      expect(opts.spec)
        .to.have.property('automanage')
        .eql([
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

      expect(opts.spec)
        .to.have.nested.property('automanage.1')
        .eql({
          property: ['mypropB'],
          event: 'update',
          phase: 'parse',
          supplyWith,
        })
    })

    it('should fill default property and phase', () => {
      opts = opts.automanage({event: 'create', supplyWith: 'date'})
      expect(opts.spec.automanage[0]).to.deep.include({phase: 'parse', property: []})
    })

    it('should support auto-increment supplyWith', () => {
      opts = opts.automanage({
        property: ['mypropA'],
        event: 'create',
        phase: 'database',
        supplyWith: 'auto-increment',
      })

      expect(opts.spec)
        .to.have.nested.property('automanage.0')
        .eql({
          property: ['mypropA'],
          event: 'create',
          phase: 'database',
          supplyWith: 'auto-increment',
        })
    })

    it('should support date supplyWith', () => {
      opts = opts.automanage({event: 'create', supplyWith: 'date'})

      expect(opts.spec)
        .to.have.nested.property('automanage.0.supplyWith')
        .a('function')

      opts.spec.automanage[0].supplyWith(validationResult)
      expect(setValue.firstCall.args[0]).to.be.instanceOf(Date)
    })

    it('should support isotimestamp supplyWith', () => {
      opts = opts.automanage({event: 'create', supplyWith: 'iso-timestamp'})

      expect(opts.spec)
        .to.have.nested.property('automanage.0.supplyWith')
        .a('function')

      opts.spec.automanage[0].supplyWith(validationResult)
      expect(setValue.firstCall.args[0]).to.match(/^\d{4}-\d{2}-\d{2}/)
    })

    it('should fail when given invalid input', () => {
      const valid = {property: [], event: '*', phase: 'database', supplyWith: () => 1}
      expect(() => opts.automanage('old')).to.throw()
      expect(() => opts.automanage({...valid, property: 'foo'})).to.throw(/property/)
      expect(() => opts.automanage({...valid, event: '1'})).to.throw(/event/)
      expect(() => opts.automanage({...valid, phase: '2'})).to.throw(/phase/)
      expect(() => opts.automanage({...valid, supplyWith: '3'})).to.throw(/supplyWith/)
    })
  })

  describe('.constrain', () => {
    let opts

    beforeEach(() => {
      opts = new Options()
    })

    it('should add the first constrain property', () => {
      opts = opts.constrain({properties: [['id']], type: 'primary'})

      expect(opts.spec)
        .to.have.property('constrain')
        .eql([
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

      expect(opts.spec)
        .to.have.nested.property('constrain.1')
        .eql({
          name: 'unique:day,other',
          properties: [['day'], ['other']],
          type: 'unique',
          meta: {behavior: 'reject'},
        })
    })

    it('should default properties, meta, and name', () => {
      opts = opts.constrain({type: 'primary'})
      expect(opts.spec.constrain[0]).to.deep.include({
        name: 'primary:',
        properties: [[]],
        meta: {},
      })
    })

    it('should add a reference constrain property', () => {
      const meta = {lookupTable: 'parents', name: 'reference:parent'}
      opts = opts.constrain({properties: [['id']], type: 'primary'}).constrain({
        properties: [['parent_id']],
        type: 'reference',
        meta,
      })

      expect(opts.spec)
        .to.have.nested.property('constrain.1')
        .eql({
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

      expect(opts.spec)
        .to.have.nested.property('constrain.1')
        .eql({
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

      expect(opts.spec)
        .to.have.nested.property('constrain.0')
        .eql({
          name: 'custom:something,other',
          properties: [['something'], ['other']],
          type: 'custom',
          meta: {foo: 'bar'},
        })
    })

    it('should use meta.name when set', () => {
      opts = opts.constrain({properties: [['id']], type: 'primary', meta: {name: 'foo'}})
      expect(opts.spec).to.have.nested.property('constrain.0.name', 'foo')
    })

    it('should throw when given empty properties', () => {
      const constrain = {properties: [], type: 'primary'}
      expect(() => opts.constrain(constrain)).to.throw(/at least 1 property/)
    })
  })

  describe('.index', () => {
    let opts

    beforeEach(() => {
      opts = new Options()
    })

    it('should add the first index', () => {
      opts = opts.index([{property: ['myprop'], direction: 'desc'}])
      expect(opts.spec)
        .to.have.property('index')
        .eql([[{property: ['myprop'], direction: 'desc'}]])
    })

    it('should add the second index', () => {
      opts = opts.index([['myprop']]).index([['otherprop'], ['second']])

      expect(opts.spec)
        .to.have.nested.property('index.1')
        .eql([
          {property: ['otherprop'], direction: 'asc'},
          {property: ['second'], direction: 'asc'},
        ])
    })

    it('should add a mixed index', () => {
      opts = opts.index([['some'], {property: ['foo'], direction: 'desc'}])
      expect(opts.spec)
        .to.have.nested.property('index.0')
        .eql([{property: ['some'], direction: 'asc'}, {property: ['foo'], direction: 'desc'}])
    })

    it('should throw when given empty properties', () => {
      expect(() => opts.index([])).to.throw(/at least 1 property/)
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
      expect(merged.automanage).to.have.length(2)
      expect(merged.constrain).to.have.length(2)
      expect(merged.index).to.have.length(2)
    })

    it('should de-dupe automanage', () => {
      const optsA = new Options()
        .automanage({
          property: ['x'],
          event: 'create',
          phase: 'validate-value',
          supplyWith: 'date',
        })
      const optsB = new Options()
        .automanage({
          property: ['x'],
          event: 'create',
          phase: 'validate-value',
          supplyWith: 'date',
        })

      const merged = Options.merge(optsA.spec, optsB.spec)
      expect(merged.automanage).to.have.length(1)
    })

    it('should de-dupe indexes', () => {
      const indexA = [{property: ['x'], direction: 'asc'}, {property: ['y'], direction: 'desc'}]
      const indexB = [{property: ['z', 'x'], direction: 'asc'}]
      const indexC = [{property: ['w'], direction: 'desc'}]
      const specA = {index: [indexA, indexB]}
      const specB = {index: [indexB, indexC]}
      const merged = Options.merge(specA, specB)
      expect(merged.index).to.eql([indexA, indexB, indexC])
    })
  })
})
