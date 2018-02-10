const expect = require('chai').expect
const Options = require('../lib-ts/options').DatabaseOptions

describe.only('lib/options.ts', () => {
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
        phase: 'post-validate',
        supplyWith,
      })

      expect(opts.spec)
        .to.have.property('automanage')
        .eql([
          {
            property: ['myprop'],
            event: 'create',
            phase: 'post-validate',
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
          phase: 'post-validate',
          supplyWith: () => 1,
        })
        .automanage({
          property: ['mypropB'],
          event: 'update',
          phase: 'pre-validate',
          supplyWith,
        })

      expect(opts.spec)
        .to.have.nested.property('automanage.1')
        .eql({
          property: ['mypropB'],
          event: 'update',
          phase: 'pre-validate',
          supplyWith,
        })
    })

    it('should support autoincrement supplyWith', () => {
      opts = opts.automanage({
        property: ['mypropA'],
        event: 'create',
        phase: 'delegate',
        supplyWith: 'autoincrement',
      })

      expect(opts.spec)
        .to.have.nested.property('automanage.0')
        .eql({
          property: ['mypropA'],
          event: 'create',
          phase: 'delegate',
          supplyWith: 'autoincrement',
        })
    })

    it('should support date supplyWith', () => {
      opts = opts.automanage({
        property: ['mypropA'],
        event: 'create',
        phase: 'delegate',
        supplyWith: 'date',
      })

      expect(opts.spec)
        .to.have.nested.property('automanage.0.supplyWith')
        .a('function')
      opts.spec.automanage[0].supplyWith().should.be.an.instanceof(Date)
    })

    it('should support isotimestamp supplyWith', () => {
      opts = opts.automanage({
        property: ['mypropA'],
        event: 'create',
        phase: 'delegate',
        supplyWith: 'iso-timestamp',
      })

      expect(opts.spec)
        .to.have.nested.property('automanage.0.supplyWith')
        .a('function')
      expect(opts.spec.automanage[0].supplyWith()).to.match(/^\d{4}-\d{2}-\d{2}/)
    })

    it('should fail when given invalid input', () => {
      const valid = {property: [], event: '*', phase: 'delegate', supplyWith: () => 1}
      expect(() => opts.automanage('old')).to.throw()
      expect(() => opts.automanage({...valid, property: 'foo'})).to.throw(/property/)
      expect(() => opts.automanage({...valid, event: ''})).to.throw(/event/)
      expect(() => opts.automanage({...valid, phase: ''})).to.throw(/phase/)
      expect(() => opts.automanage({...valid, supplyWith: ''})).to.throw(/supplyWith/)
    })
  })

  describe('.constraint', () => {
    let opts

    beforeEach(() => {
      opts = new Options()
    })

    it('should add the first constraint property', () => {
      opts = opts.constraint({properties: [['id']], type: 'primary'})

      expect(opts.spec)
        .to.have.property('constraint')
        .eql([
          {
            name: 'primary:id',
            properties: [['id']],
            type: 'primary',
            meta: {},
          },
        ])
    })

    it('should add the second constraint property', () => {
      opts = opts
        .constraint({properties: [['id']], type: 'primary'})
        .constraint({properties: [['day'], ['other']], type: 'unique', meta: {behavior: 'reject'}})

      expect(opts.spec)
        .to.have.nested.property('constraint.1')
        .eql({
          name: 'unique:day,other',
          properties: [['day'], ['other']],
          type: 'unique',
          meta: {behavior: 'reject'},
        })
    })

    it('should add a reference constraint property', () => {
      const meta = {lookupTable: 'parents'}
      opts = opts.constraint({properties: [['id']], type: 'primary'}).constraint({
        name: 'reference:parent',
        properties: [['parent_id']],
        type: 'reference',
        meta,
      })

      expect(opts.spec)
        .to.have.nested.property('constraint.1')
        .eql({
          name: 'reference:parent',
          properties: [['parent_id']],
          type: 'reference',
          meta,
        })
    })

    it('should add an immutable constraint property', () => {
      opts = opts
        .constraint({properties: [['id']], type: 'primary'})
        .constraint({properties: [['canonical_id'], ['created_on']], type: 'immutable'})

      expect(opts.spec)
        .to.have.nested.property('constraint.1')
        .eql({
          name: 'immutable:canonical_id,created_on',
          properties: [['canonical_id'], ['created_on']],
          type: 'immutable',
          meta: {},
        })
    })

    it('should add a custom constraint property', () => {
      opts = opts.constraint({
        properties: [['something'], ['other']],
        type: 'custom',
        meta: {foo: 'bar'},
      })

      expect(opts.spec)
        .to.have.nested.property('constraint.0')
        .eql({
          name: 'custom:something,other',
          properties: [['something'], ['other']],
          type: 'custom',
          meta: {foo: 'bar'},
        })
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
  })

  describe.skip('.toObject', () => {
    const now = () => new Date()
    const checksum = item => item.id * Math.random()

    it('should return all of the settings', () => {
      const meta = {lookupTable: 'parents', name: 'reference:parent'}
      const opts = new Options()
        .index('type')
        .index(['type', 'size', '-created_at'])
        .automanage('checksum', 'update', 'post-validate', checksum)
        .automanage('created_at', 'create', now)
        .automanage('updated_at', 'update', now)
        .constraint('id', 'primary')
        .constraint(['type', 'version'], 'unique')
        .constraint(['parent_id'], 'reference', meta)

      expect(opts.spec).to.eql({
        indexes: [
          [{property: ['type'], direction: 'asc'}],
          [
            {property: ['type'], direction: 'asc'},
            {property: ['size'], direction: 'asc'},
            {property: ['created_at'], direction: 'desc'},
          ],
        ],
        automanage: [
          {property: ['checksum'], event: 'update', phase: 'post-validate', supplyWith: checksum},
          {property: ['created_at'], event: 'create', phase: 'pre-validate', supplyWith: now},
          {property: ['updated_at'], event: 'update', phase: 'pre-validate', supplyWith: now},
        ],
        constraints: [
          {name: 'primary:id', properties: ['id'], type: 'primary', meta: {}},
          {name: 'unique:type,version', properties: ['type', 'version'], type: 'unique', meta: {}},
          {name: 'reference:parent', properties: ['parent_id'], type: 'reference', meta},
        ],
      })
    })
  })
})
