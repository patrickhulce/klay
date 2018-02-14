const expect = require('chai').expect
const ModelContext = require('klay').ModelContext
const DatabaseExtension = require('../lib-ts/extension').DatabaseExtension
const DatabaseOptions = require('../lib-ts/options').DatabaseOptions

describe.only('lib-ts/extension.ts', () => {
  let modelContext

  beforeEach(() => {
    const extension = new DatabaseExtension()
    modelContext = ModelContext.create().use(extension)
  })

  describe('hooks', () => {
    it('should gather child db specifications', () => {
      const child = modelContext.string().constraint({type: 'primary'})
      const model = modelContext.object().children({id: child})
      expect(model.spec.db).to.eql({
        automanage: [],
        index: [],
        constraint: [
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
    it('should add integerID', () => {
      const model = modelContext.integerID()
      expect(model.spec.db.constraint).to.have.length(1)
      expect(model.spec.db.automanage).to.have.length(1)
      expect(model.spec.db.constraint[0].type).to.equal('primary')
    })

    it('should add uuidID', () => {
      const model = modelContext.uuidID()
      expect(model.spec.db.constraint).to.have.length(1)
      expect(model.spec.db.automanage).to.have.length(1)
      expect(model.spec.db.constraint[0].type).to.equal('primary')
    })

    it('should add createdAt', () => {
      const model = modelContext.createdAt()
      expect(model.spec.db.constraint).to.have.length(1)
      expect(model.spec.db.automanage).to.have.length(1)
      expect(model.spec.db.constraint[0].type).to.equal('immutable')
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
        constraint: [],
        index: [[{property: ['x'], direction: 'asc'}]],
      })
      const optionsB = new DatabaseOptions().index([['y']])
      model = model.db(optionsB.spec)
      expect(model.spec.db).to.eql({
        automanage: [],
        constraint: [],
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
        constraint: [],
        index: [[{property: ['x'], direction: 'asc'}]],
      })
      const optionsB = new DatabaseOptions().index([['y']])
      model = model.db(optionsB.spec, {shouldMerge: true})
      expect(model.spec.db).to.eql({
        automanage: [],
        constraint: [],
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

  describe('.constraint', () => {
    it('should set constraint of model', () => {
      const model = modelContext.create().constraint({
        properties: [['x']],
        type: 'primary',
      })

      expect(model.spec.db.constraint).to.eql([
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
    it('should set constraint on model', () => {
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
