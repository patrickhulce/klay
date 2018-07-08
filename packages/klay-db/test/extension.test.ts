const ModelContext = require('klay-core').ModelContext
const DatabaseExtension = require('../lib/extension').DatabaseExtension
const DatabaseOptions = require('../lib/options').DatabaseOptions
const doPasswordsMatch = require('../lib/password').doPasswordsMatch

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
      expect(model.spec.db).toEqual({
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
      expect(model.spec.db.constrain).toHaveLength(1)
      expect(model.spec.db.automanage).toHaveLength(1)
      expect(model.spec.db.constrain[0].type).toBe('primary')
    })

    it('should add uuidId', () => {
      const model = modelContext.uuidId()
      expect(model.spec.db.constrain).toHaveLength(1)
      expect(model.spec.db.automanage).toHaveLength(1)
      expect(model.spec.db.constrain[0].type).toBe('primary')
    })

    it('should add createdAt', () => {
      const model = modelContext.createdAt()
      expect(model.spec.db.constrain).toHaveLength(1)
      expect(model.spec.db.automanage).toHaveLength(1)
      expect(model.spec.db.constrain[0].type).toBe('immutable')
    })

    it('should add updatedAt', () => {
      const model = modelContext.updatedAt()
      expect(model.spec.db.automanage).toHaveLength(1)
    })

    describe('#password', () => {
      it('should create a string model', () => {
        const model = modelContext.password()
        expect(model.spec.type).toBe('string')
      })

      it('should hash the password with a salt', () => {
        const model = modelContext.password()
        const [hashA, saltA] = model.validate('password').value.split('!')
        const [hashB, saltB] = model.validate('password').value.split('!')

        expect(hashA).toHaveLength(32)
        expect(hashB).toHaveLength(32)
        expect(saltA).toHaveLength(32)
        expect(saltB).toHaveLength(32)
        expect(hashA).not.toBe(hashB)
        expect(saltA).not.toBe(saltB)
      })

      it('should leave existing hashes untouched', () => {
        const model = modelContext.password()
        const valueA = model.validate('password').value
        const valueB = model.validate(valueA).value
        expect(valueA).toEqual(valueB)
      })

      it('should set max of model appropriately', () => {
        const model = modelContext.password()
        const {value} = model.validate('password')
        expect(model.spec.max).toEqual(value.length)
      })

      it('should use the right algorithm', () => {
        const model = modelContext.password({algorithm: 'sha224'})
        const [hash] = model.validate('password').value.split('!')
        expect(hash).toHaveLength(32)
      })

      it('should use the right salt length', () => {
        const model = modelContext.password({saltLength: 64})
        const [hash, salt] = model.validate('password').value.split('!')
        expect(hash).toHaveLength(32)
        expect(salt).toHaveLength(64)
      })

      it('should be verifyable', async () => {
        const model = modelContext.password({saltLength: 64})
        const hashedPassword = model.validate('password1').value
        const options = model.spec.db.password
        expect(await doPasswordsMatch('password1', hashedPassword, options)).toBe(true)
      })
    })
  })

  describe('.db', () => {
    it('should set db specification', () => {
      const optionsA = new DatabaseOptions().index([['x']])
      let model = modelContext.create().db(optionsA.spec)
      expect(model.spec.db).toEqual({
        automanage: [],
        constrain: [],
        index: [[{property: ['x'], direction: 'asc'}]],
      })
      const optionsB = new DatabaseOptions().index([['y']])
      model = model.db(optionsB.spec)
      expect(model.spec.db).toEqual({
        automanage: [],
        constrain: [],
        index: [[{property: ['y'], direction: 'asc'}]],
      })
    })

    it('should clear db specification', () => {
      const options = new DatabaseOptions().index([['x']])
      let model = modelContext.create().db(options.spec)
      expect(typeof model.spec.db).toBe('object')
      model = model.db()
      expect(model.spec.db).toBe(undefined)
    })

    it('should merge db specifications', () => {
      const optionsA = new DatabaseOptions().index([['x']])
      let model = modelContext.create().db(optionsA.spec)
      expect(model.spec.db).toEqual({
        automanage: [],
        constrain: [],
        index: [[{property: ['x'], direction: 'asc'}]],
      })
      const optionsB = new DatabaseOptions().index([['y']])
      model = model.db(optionsB.spec, {shouldMerge: true})
      expect(model.spec.db).toEqual({
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

      expect(model.spec.db.automanage).toEqual([
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

      expect(model.spec.db.constrain).toEqual([
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
      expect(model.spec.db.index).toEqual([[{property: ['x'], direction: 'asc'}]])
    })
  })

  describe('.autoIncrement', () => {
    it('should set constrain on model', () => {
      const model = modelContext.create().autoIncrement()
      expect(model.spec.db).toHaveProperty('automanage.0.supplyWith', 'auto-increment')
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
      expect(createModel.validate().value).toBeInstanceOf(Date)
      const updateModel = model.toDatabaseEventModel('update')
      expect(updateModel.validate().value).toBe(undefined)
    })
  })
})
