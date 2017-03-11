/* eslint-disable no-use-extend-native/no-use-extend-native, no-unused-expressions */
const _ = require('lodash')

defineTest('Options.js', Options => {
  describe('#constructor', () => {
    it('should set spec properties', () => {
      const opts = new Options({indexes: [{property: 'foo', direction: 'asc'}]})
      opts.should.be.instanceof(Options)
      opts.should.have.deep.property('spec.indexes.0.property', 'foo')
    })

    it('should return the argument when it is already an options', () => {
      const optsA = new Options({hello: 1})
      const optsB = new Options(optsA)
      optsB.should.equal(optsA)
    })

    it('should work when not using `new`', () => {
      // eslint-disable-next-line new-cap
      const opts = Options({hello: 'blasphemy'})
      opts.should.be.instanceof(Options)
      opts.should.have.deep.property('spec.hello', 'blasphemy')
    })
  })

  describe('#automanage', () => {
    let opts

    beforeEach(() => {
      opts = new Options()
    })

    it('should add the first automanaged property', () => {
      const supplyWith = () => new Date()
      opts = opts.automanage('myprop', 'create', 'post-validate', supplyWith)
      opts.spec.should.have.property('automanaged').eql([{
        property: 'myprop', event: 'create',
        step: 'post-validate',
        supplyWith,
      }])
    })

    it('should add the second automanaged property', () => {
      const supplyWith = () => new Date()
      opts = opts
        .automanage('mypropA', 'create', 'post-validate', _.identity)
        .automanage('mypropB', 'update', supplyWith)

      opts.spec.should.have.deep.property('automanaged.1').eql({
        property: 'mypropB', event: 'update',
        step: 'pre-validate',
        supplyWith,
      })
    })

    it('should support autoincrement supplyWith', () => {
      opts = opts.automanage('mypropA', 'create', 'insert', 'autoincrement')

      opts.spec.should.have.deep.property('automanaged.0').eql({
        property: 'mypropA', event: 'create', step: 'insert',
        supplyWith: 'autoincrement',
      })
    })

    it('should support date supplyWith', () => {
      opts = opts.automanage('mypropA', 'create', 'post-validate', 'date')
      opts.spec.should.have.deep.property('automanaged.0.supplyWith').a('function')
      opts.spec.automanaged[0].supplyWith().should.be.an.instanceof(Date)
    })

    it('should support isotimestamp supplyWith', () => {
      opts = opts.automanage('mypropA', 'create', 'post-validate', 'isotimestamp')
      opts.spec.should.have.deep.property('automanaged.0.supplyWith').a('function')
      opts.spec.automanaged[0].supplyWith().should.match(/^\d{4}-\d{2}-\d{2}/)
    })

    it('should work with pre-existing automanaged properties', () => {
      const supplyWith = () => new Date()
      opts = new Options({automanaged: [null, null]})
        .automanage('mypropC', 'create', supplyWith)

      opts.spec.should.have.deep.property('automanaged.2').eql({
        property: 'mypropC', event: 'create',
        step: 'pre-validate',
        supplyWith,
      })
    })

    it('should fail when no property is given', () => {
      (function () {
        opts.automanage(null, 'create', _.noop)
      }).should.throw
    })

    it('should fail when unknown event is given', () => {
      (function () {
        opts.automanage('prop', 'something', _.noop)
      }).should.throw
    })

    it('should fail when unknown step is given', () => {
      (function () {
        opts.automanage('mypropA', 'create', 'unknown', _.noop)
      }).should.throw
    })

    it('should fail when unknown supplyWith is given', () => {
      (function () {
        opts.automanage('mypropA', 'create', 'foobar')
      }).should.throw(/invalid automanage supplyWith/)
    })
  })

  describe('#constrain', () => {
    let opts

    beforeEach(() => {
      opts = new Options()
    })

    it('should add the first constraint property', () => {
      opts = opts.constrain('id', 'primary')
      opts.spec.should.have.property('constraints').eql([{
        name: 'primary:id', properties: ['id'], type: 'primary', meta: {},
      }])
    })

    it('should add the second constraint property', () => {
      opts = opts
        .constrain('id', 'primary')
        .constrain(['day', 'other'], 'unique', {behavior: 'reject'})

      opts.spec.should.have.deep.property('constraints.1').eql({
        name: 'unique:day,other',
        properties: ['day', 'other'],
        type: 'unique',
        meta: {behavior: 'reject'},
      })
    })

    it('should add a reference constraint property', () => {
      const meta = {lookupTable: 'parents', name: 'reference:parent'}
      opts = opts
        .constrain('id', 'primary')
        .constrain(['parent_id', 'other'], 'reference', meta)

      opts.spec.should.have.deep.property('constraints.1').eql({
        name: 'reference:parent',
        properties: ['parent_id', 'other'],
        type: 'reference',
        meta,
      })
    })

    it('should add an immutable constraint property', () => {
      opts = opts
        .constrain('id', 'primary')
        .constrain(['canonical_id', 'unchangeable'], 'immutable')

      opts.spec.should.have.deep.property('constraints.1').eql({
        name: 'immutable:canonical_id,unchangeable',
        properties: ['canonical_id', 'unchangeable'],
        type: 'immutable',
        meta: {},
      })
    })

    it('should add a custom constraint property', () => {
      opts = opts.constrain(['something', 'other'], 'custom', {foo: 'bar'})

      opts.spec.should.have.deep.property('constraints.0').eql({
        name: 'custom:something,other',
        properties: ['something', 'other'],
        type: 'custom',
        meta: {foo: 'bar'},
      })
    })
  })

  describe('#index', () => {
    let opts

    beforeEach(() => {
      opts = new Options()
    })

    it('should add the first index', () => {
      opts = opts.index('myprop', 'desc')
      opts.spec.should.have.property('indexes').eql([
        [{property: 'myprop', direction: 'desc'}],
      ])
    })

    it('should add the second index', () => {
      opts = opts
        .index('myprop')
        .index(['otherprop', '-second'])

      opts.spec.should.have.deep.property('indexes.1').eql([
        {property: 'otherprop', direction: 'asc'},
        {property: 'second', direction: 'desc'},
      ])
    })

    it('should add a mixed index', () => {
      opts = opts.index(['some', {property: 'foo', direction: 'desc'}])
      opts.spec.should.have.deep.property('indexes.0').eql([
        {property: 'some', direction: 'asc'},
        {property: 'foo', direction: 'desc'},
      ])
    })
  })

  describe('#toObject', () => {
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
        .constrain('id', 'primary')
        .constrain(['type', 'version'], 'unique')
        .constrain(['parent_id'], 'reference', meta)

      opts.spec.should.eql({
        indexes: [
          [
            {property: 'type', direction: 'asc'},
          ],
          [
            {property: 'type', direction: 'asc'},
            {property: 'size', direction: 'asc'},
            {property: 'created_at', direction: 'desc'},
          ],
        ],
        automanaged: [
          {property: 'checksum', event: 'update', step: 'post-validate', supplyWith: checksum},
          {property: 'created_at', event: 'create', step: 'pre-validate', supplyWith: now},
          {property: 'updated_at', event: 'update', step: 'pre-validate', supplyWith: now},
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
