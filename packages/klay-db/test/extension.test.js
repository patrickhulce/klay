const klay = require('klay')
const Options = require('../lib/Options.js')

defineTest('extension.js', extension => {
  let inst

  beforeEach(() => {
    klay.reset()
    inst = klay()
    inst.use(extension())
  })

  describe('#builders', () => {
    const n = '__childplaceholder__'
    it('should add the properties to the builders', () => {
      inst.builders.should.have.property('integerId').a('function')
      inst.builders.should.have.property('uuidId').a('function')
      inst.builders.should.have.property('createdAt').a('function')
      inst.builders.should.have.property('updatedAt').a('function')
    })

    describe('#integerId', () => {
      it('should configure a model properly', () => {
        const model = inst.builders.integerId()
        model.spec.should.have.property('type', 'number')
        model.spec.should.have.property('format', 'integer')
        model.spec.should.have.property('db').eql({
          automanaged: [{event: 'create', step: 'insert', supplyWith: 'autoincrement', property: n}],
          constraints: [{name: `primary:${n}`, properties: [n], type: 'primary', meta: {}}],
        })
      })
    })

    describe('#uuidId', () => {
      it('should configure a model properly', () => {
        const model = inst.builders.uuidId()
        const supplyWith = model.spec.db.automanaged[0].supplyWith
        model.spec.should.have.property('type', 'string')
        model.spec.should.have.property('format', 'uuid')
        model.spec.should.have.property('db').eql({
          automanaged: [{event: 'create', step: 'pre-validate', supplyWith, property: n}],
          constraints: [{name: `primary:${n}`, properties: [n], type: 'primary', meta: {}}],
        })

        supplyWith().should.match(/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/)
      })
    })

    describe('#createdAt', () => {
      it('should configure a model properly', () => {
        const model = inst.builders.createdAt()
        const supplyWith = model.spec.db.automanaged[0].supplyWith
        model.spec.should.have.property('type', 'date')
        model.spec.should.have.property('db').eql({
          automanaged: [{event: 'create', step: 'pre-validate', supplyWith, property: n}],
          constraints: [{name: `immutable:${n}`, properties: [n], type: 'immutable', meta: {}}],
        })

        supplyWith().should.be.an.instanceof(Date)
      })
    })

    describe('#updatedAt', () => {
      it('should configure a model properly', () => {
        const model = inst.builders.updatedAt()
        const supplyWith = model.spec.db.automanaged[0].supplyWith
        model.spec.should.have.property('type', 'date')
        model.spec.should.have.property('db').eql({
          automanaged: [{event: '*', step: 'pre-validate', supplyWith, property: n}],
        })

        supplyWith().should.be.an.instanceof(Date)
      })
    })
  })

  describe('#hooks', () => {
    it('should add the children hook', () => {
      const children = {id: inst.builders.integer().unique()}
      const model = inst.builders.object().children(children)
      model.spec.should.have.deep.property('db.constraints').length(1)
    })
  })

  describe('#extend', () => {
    const generateDate = () => new Date()
    const options = new Options()
      .index('id')
      .index('created_at', 'desc')
      .automanage('created_at', 'create', generateDate)

    it('should add the properties to the model', () => {
      const model = inst.builders.object()
      model.should.have.property('db').a('function')
      model.should.have.property('dbindex').a('function')
      model.should.have.property('dbconstrain').a('function')
      model.should.have.property('dbautomanage').a('function')
      model.should.have.property('dbindexChildren').a('function')
      model.should.have.property('dbconstrainChildren').a('function')
      model.should.have.property('dbautomanageChildren').a('function')
      model.should.have.property('primaryKey').a('function')
      model.should.have.property('unique').a('function')
      model.should.have.property('immutable').a('function')
      model.should.have.property('autoincrement').a('function')
    })

    it('should respect requested footprint', () => {
      let model

      klay.reset()
      inst = klay().use(extension({footprint: 'medium'}))
      model = inst.builders.object()
      model.should.have.property('db').a('function')
      model.should.have.property('dbindex').a('function')
      model.should.have.property('dbindexChildren').a('function')
      model.should.not.have.property('primaryKey')

      klay.reset()
      inst = klay().use(extension({footprint: 'tiny'}))
      model = inst.builders.object()
      model.should.have.property('db').a('function')
      model.should.not.have.property('dbindex').a('function')
      model.should.not.have.property('dbindexChildren').a('function')
      model.should.not.have.property('primaryKey')

      klay.reset()
      inst = klay()
      inst.use(extension())
    })

    it('should update the db property of the spec', () => {
      const model = inst.builders.object()
        .dbindexChildren('id')
        .dbindexChildren('created_at', 'desc')
        .dbautomanageChildren('created_at', 'create', generateDate)
      model.spec.db.should.eql(options.toObject())
    })

    describe('#db', () => {
      it('should update the db property of the spec', () => {
        const model = inst.builders.object().db(options)
        model.spec.should.have.deep.property('db.indexes').length(2)
        model.spec.should.have.deep.property('db.automanaged').length(1)
      })

      it('should update the db property of the spec with plain object', () => {
        const model = inst.builders.object().db(options.toObject())
        model.spec.should.have.deep.property('db.indexes').length(2)
        model.spec.should.have.deep.property('db.automanaged').length(1)
      })
    })

    describe('#dbindex', () => {
      it('should update the index property of db options', () => {
        const model = inst.builders.object().dbindex('desc')
        model.spec.should.have.deep.property('db.indexes.0').eql([
          {property: '__childplaceholder__', direction: 'desc'},
        ])
      })
    })

    describe('#dbconstrain', () => {
      it('should update the constraints property of db options', () => {
        const model = inst.builders.object().dbconstrain('primary')
        model.spec.should.have.deep.property('db.constraints.0').eql({
          properties: ['__childplaceholder__'], type: 'primary',
          name: 'primary:__childplaceholder__', meta: {},
        })
      })
    })

    describe('#dbautomanage', () => {
      it('should update the automanaged property of db options', () => {
        const model = inst.builders.object().dbautomanage('create', () => null)
        model.spec.should.have.deep.property('db.automanaged.0.property').eql('__childplaceholder__')
      })
    })

    describe('#dbindexChildren', () => {
      it('should update the index property of db options', () => {
        const model = inst.builders.object().dbindexChildren(['foo', '-bar'])
        model.spec.should.have.deep.property('db.indexes.0').eql([
          {property: 'foo', direction: 'asc'},
          {property: 'bar', direction: 'desc'},
        ])
      })
    })

    describe('#dbconstrainChildren', () => {
      it('should update the constraints property of db options', () => {
        const model = inst.builders.object().dbconstrainChildren('id', 'primary')
        model.spec.should.have.deep.property('db.constraints.0').eql({
          properties: ['id'], type: 'primary', name: 'primary:id', meta: {},
        })
      })
    })

    describe('#dbautomanageChildren', () => {
      it('should update the automanaged property of db options', () => {
        const model = inst.builders.object().dbautomanageChildren('created_at', 'create', () => null)
        model.spec.should.have.deep.property('db.automanaged.0.property').eql('created_at')
      })
    })

    describe('#primaryKey', () => {
      it('should add primary constraint', () => {
        const model = inst.builders.string().primaryKey()
        model.spec.should.have.deep.property('db.constraints.0').eql({
          properties: ['__childplaceholder__'], type: 'primary',
          name: 'primary:__childplaceholder__', meta: {},
        })
      })
    })

    describe('#unique', () => {
      it('should add unique constraint', () => {
        const model = inst.builders.string().unique()
        model.spec.should.have.deep.property('db.constraints.0').eql({
          properties: ['__childplaceholder__'], type: 'unique',
          name: 'unique:__childplaceholder__', meta: {},
        })
      })
    })

    describe('#immutable', () => {
      it('should add immutable constraint', () => {
        const model = inst.builders.string().immutable()
        model.spec.should.have.deep.property('db.constraints.0').eql({
          properties: ['__childplaceholder__'], type: 'immutable',
          name: 'immutable:__childplaceholder__', meta: {},
        })
      })
    })

    describe('#autoincrement', () => {
      it('should add autoincrement automanaged', () => {
        const model = inst.builders.string().autoincrement()
        model.spec.should.have.deep.property('db.automanaged.0').eql({
          property: '__childplaceholder__', event: 'create',
          step: 'insert', supplyWith: 'autoincrement',
        })
      })
    })
  })
})
