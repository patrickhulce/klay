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
      const child = modelContext.string().primaryKey()
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

  describe('.db', () => {
    it('should set db specification', () => {
      const optionsA = new DatabaseOptions().index([['x']])
      let model = modelContext.create().db(optionsA.spec)
      expect(model.spec.db).to.eql({index: [[{property: ['x'], direction: 'asc'}]]})
      const optionsB = new DatabaseOptions().index([['y']])
      model = model.db(optionsB.spec)
      expect(model.spec.db).to.eql({index: [[{property: ['y'], direction: 'asc'}]]})
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
      expect(model.spec.db).to.eql({index: [[{property: ['x'], direction: 'asc'}]]})
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

  describe('.primaryKey', () => {
    it('should set constraint on model', () => {
      const model = modelContext.create().primaryKey()
      expect(model.spec.db).to.have.nested.property('constraint[0].type', 'primary')
    })
  })

  describe('.immutable', () => {
    it('should set constraint on model', () => {
      const model = modelContext.create().immutable()
      expect(model.spec.db).to.have.nested.property('constraint[0].type', 'immutable')
    })
  })

  describe('.unique', () => {
    it('should set constraint on model', () => {
      const model = modelContext.create().unique()
      expect(model.spec.db).to.have.nested.property('constraint[0].type', 'unique')
    })
  })

  describe('.autoIncrement', () => {
    it('should set constraint on model', () => {
      const model = modelContext.create().autoIncrement()
      expect(model.spec.db).to.have.nested.property('automanage[0].supplyWith', 'auto-increment')
    })
  })
})
