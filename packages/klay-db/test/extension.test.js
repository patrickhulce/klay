const expect = require('chai').expect
const ModelContext = require('klay-core').ModelContext
const DatabaseExtension = require('../dist/extension').DatabaseExtension
const DatabaseOptions = require('../dist/options').DatabaseOptions

describe('lib/extension.ts', () => {
  let modelContext

  beforeEach(() => {
    const extension = new DatabaseExtension()
    modelContext = ModelContext.create().use(extension)
  })

  describe('hooks', () => {
    it('should gather child db specifications', () => {
      const child = modelContext.string().constrain({type: 'primary'})
      const model = modelContext.object().children({id: child})
      expect(model.spec.db).to.eql({
        automanage: [],
        index: [],
        constrain: [
          {
            properties: [['id']],
            type: 'primary',
            name: 'primary:id',
            meta: {},
          },
        ],
      })
    })
  })

  describe('builders', () => {
    it('should add integerId', () => {
      const model = modelContext.integerId()
      expect(model.spec.db.constrain).to.have.length(1)
      expect(model.spec.db.automanage).to.have.length(1)
      expect(model.spec.db.constrain[0].type).to.equal('primary')
    })

    it('should add uuidId', () => {
      const model = modelContext.uuidId()
      expect(model.spec.db.constrain).to.have.length(1)
      expect(model.spec.db.automanage).to.have.length(1)
      expect(model.spec.db.constrain[0].type).to.equal('primary')
    })

    it('should add createdAt', () => {
      const model = modelContext.createdAt()
      expect(model.spec.db.constrain).to.have.length(1)
      expect(model.spec.db.automanage).to.have.length(1)
      expect(model.spec.db.constrain[0].type).to.equal('immutable')
    })

    it('should add updatedAt', () => {
      const model = modelContext.updatedAt()
      expect(model.spec.db.automanage).to.have.length(1)
    })
  })

  describe('.db', () => {
    it('should set db specification', () => {
      const optionsA = new DatabaseOptions().index([['x']])
      let model = modelContext.create().db(optionsA.spec)
      expect(model.spec.db).to.eql({
        automanage: [],
        constrain: [],
        index: [[{property: ['x'], direction: 'asc'}]],
      })
      const optionsB = new DatabaseOptions().index([['y']])
      model = model.db(optionsB.spec)
      expect(model.spec.db).to.eql({
        automanage: [],
        constrain: [],
        index: [[{property: ['y'], direction: 'asc'}]],
      })
    })

    it('should clear db specification', () => {
      const options = new DatabaseOptions().index([['x']])
      let model = modelContext.create().db(options.spec)
      expect(model.spec.db).to.be.an('object')
      model = model.db()
      expect(model.spec.db).to.equal(undefined)
    })

    it('should merge db specifications', () => {
      const optionsA = new DatabaseOptions().index([['x']])
      let model = modelContext.create().db(optionsA.spec)
      expect(model.spec.db).to.eql({
        automanage: [],
        constrain: [],
        index: [[{property: ['x'], direction: 'asc'}]],
      })
      const optionsB = new DatabaseOptions().index([['y']])
      model = model.db(optionsB.spec, {shouldMerge: true})
      expect(model.spec.db).to.eql({
        automanage: [],
        constrain: [],
        index: [[{property: ['x'], direction: 'asc'}], [{property: ['y'], direction: 'asc'}]],
      })
    })
  })

  describe('.automanage', () => {
    it('should set automanage of model', () => {
      const model = modelContext.create().automanage({
        property: ['x'],
        event: 'create',
        phase: 'database',
        supplyWith: 'auto-increment',
      })

      expect(model.spec.db.automanage).to.eql([
        {
          property: ['x'],
          event: 'create',
          phase: 'database',
          supplyWith: 'auto-increment',
        },
      ])
    })
  })

  describe('.constrain', () => {
    it('should set constrain of model', () => {
      const model = modelContext.create().constrain({
        properties: [['x']],
        type: 'primary',
      })

      expect(model.spec.db.constrain).to.eql([
        {
          name: 'primary:x',
          properties: [['x']],
          type: 'primary',
          meta: {},
        },
      ])
    })
  })

  describe('.index', () => {
    it('should set index of model', () => {
      const model = modelContext.create().index([['x']])
      expect(model.spec.db.index).to.eql([[{property: ['x'], direction: 'asc'}]])
    })
  })

  describe('.autoIncrement', () => {
    it('should set constrain on model', () => {
      const model = modelContext.create().autoIncrement()
      expect(model.spec.db).to.have.nested.property('automanage[0].supplyWith', 'auto-increment')
    })
  })

  describe('.toDatabaseEventModel', () => {
    it('should get the appropriate model for the event', () => {
      const model = modelContext.create().automanage({
        property: [],
        event: 'create',
        phase: 'parse',
        supplyWith: 'date',
      })

      const createModel = model.toDatabaseEventModel('create')
      expect(createModel.validate().value).to.be.instanceof(Date)
      const updateModel = model.toDatabaseEventModel('update')
      expect(updateModel.validate().value).to.equal(undefined)
    })
  })
})
