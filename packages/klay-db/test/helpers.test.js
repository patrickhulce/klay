const ModelContext = require('klay-core').ModelContext
const helpers = require('../lib/helpers')
const DatabaseExtension = require('../lib/extension').DatabaseExtension
const DatabaseOptions = require('../lib/options').DatabaseOptions

const AUTOMANAGE = {property: [], event: '*', phase: 'database', supplyWith: 'auto-increment'}
const CONSTRAINT = {properties: [[]], type: 'unique'}

describe('lib/helpers.ts', () => {
  describe('#addPropertyNames', () => {
    it('adds names to spec properties', () => {
      const options = new DatabaseOptions()
        .automanage({...AUTOMANAGE, property: ['nested']})
        .constrain({...CONSTRAINT, properties: [['nested'], ['other']]})
        .index([['nested']])
        .index([[]])

      const prefixed = helpers.addPropertyNames(options.spec, 'x')
      expect(prefixed).toHaveProperty('automanage.0.property', ['x', 'nested'])
      expect(prefixed).toHaveProperty('constrain.0.properties', [['x', 'nested'], ['x', 'other']])
      expect(prefixed).toHaveProperty('index.0.0.property', ['x', 'nested'])
      expect(prefixed).toHaveProperty('index.1', [{property: ['x'], direction: 'asc'}])
    })
  })

  describe('#mergeChildrenIntoRoot', () => {
    let children

    beforeEach(() => {
      const extension = new DatabaseExtension()
      const context = ModelContext.create().use(extension)
      const model = context.object().children({
        id: context
          .integer()
          .constrain({type: 'primary'})
          .autoIncrement(),
        accountId: context.integer().constrain({type: 'reference'}),
        email: context.email().constrain({type: 'unique'}),
        updatedAt: context
          .dateTime()
          .index([{property: [], direction: 'desc'}])
          .automanage({...AUTOMANAGE, supplyWith: 'iso-timestamp'}),
      })

      children = model.spec.children
    })

    it('should preserve root spec', () => {
      const index = [{property: ['foo'], direction: 'asc'}]
      const root = {index: [index]}
      const results = helpers.mergeChildrenIntoRoot(root, [])
      expect(results).toBe(root)
      expect(results).toEqual({index: [index]})
    })

    it('should collect db options from children', () => {
      const results = helpers.mergeChildrenIntoRoot({}, children)
      expect(results.automanage).toHaveLength(2)
      expect(results.constrain).toHaveLength(3)
      expect(results.index).toHaveLength(1)
    })

    it('should be idempotent', () => {
      let results = helpers.mergeChildrenIntoRoot({}, children)
      expect(results.automanage).toHaveLength(2)
      expect(results.constrain).toHaveLength(3)
      expect(results.index).toHaveLength(1)

      results = helpers.mergeChildrenIntoRoot({}, children)
      expect(results.automanage).toHaveLength(2)
      expect(results.constrain).toHaveLength(3)
      expect(results.index).toHaveLength(1)
    })

    it('should replace property names', () => {
      const results = helpers.mergeChildrenIntoRoot({}, children)
      expect(results).toHaveProperty('index.0.0.property', ['updatedAt'])

      expect(results).toHaveProperty('constrain.0.properties.0', ['id'])
      expect(results).toHaveProperty('constrain.0.name', 'primary:id')
      expect(results).toHaveProperty('constrain.1.properties.0', ['accountId'])
      expect(results).toHaveProperty('constrain.1.name', 'reference:accountId')
      expect(results).toHaveProperty('constrain.1.meta.referencedModel', 'account')
      expect(results).toHaveProperty('constrain.2.properties.0', ['email'])
      expect(results).toHaveProperty('constrain.2.name', 'unique:email')

      expect(results).toHaveProperty('automanage.0.property', ['id'])
      expect(results).toHaveProperty('automanage.1.property', ['updatedAt'])
    })
  })

  describe('#getModelForEvent', () => {
    let model

    beforeEach(() => {
      const extension = new DatabaseExtension()
      const context = ModelContext.create()
        .use(extension)
        .use({defaults: {required: true}})
      // eslint-disable-next-line no-mixed-operators
      const checksum = value => value.age * 5 + value.name
      const nested = {prop: context.string().automanage({supplyWith: 'uuid', event: '*'})}

      model = context.object().children({
        id: context
          .integer()
          .constrain({type: 'primary'})
          .autoIncrement(),
        email: context.email().constrain({type: 'unique'}),
        age: context.integer(),
        name: context.string(),
        nested: context
          .object()
          .children(nested)
          .optional()
          .default({}),
        checksum: context
          .string()
          .automanage({
            property: [],
            event: '*',
            phase: 'parse',
            supplyWith: value => value.setValue(checksum(value.rootValue)),
          })
          .optional(),
        pristine: context
          .boolean()
          .automanage({
            property: [],
            event: 'create',
            phase: 'parse',
            supplyWith: value => value.setValue(true),
          })
          .automanage({
            property: [],
            event: 'update',
            phase: 'parse',
            supplyWith: value => value.setValue(false),
          }),
        createdAt: context
          .dateTime()
          .automanage({
            property: [],
            event: 'create',
            phase: 'parse',
            supplyWith: 'iso-timestamp',
          })
          .optional(),
        updatedAt: context
          .dateTime()
          .automanage({
            property: [],
            event: '*',
            phase: 'parse',
            supplyWith: 'iso-timestamp',
          })
          .optional(),
      })
    })

    it('should build the create model', () => {
      const createModel = helpers.getModelForEvent(model, 'create')
      const results = createModel
        .validate({
          name: 'John',
          age: '17',
          email: 'john@example.com',
        })
        .toJSON()

      expect(results.value.createdAt).toBeInstanceOf(Date)
      expect(results.value.updatedAt).toBeInstanceOf(Date)
      expect(typeof results.value.nested.prop).toBe('string')

      expect(results.value).toMatchObject({
        id: undefined, // should be filled by database
        name: 'John',
        age: 17,
        email: 'john@example.com',
        checksum: '85John',
        pristine: true,
      })
    })

    it('should build the update model', () => {
      const updateModel = helpers.getModelForEvent(model, 'update')
      const results = updateModel
        .validate({
          id: 12,
          name: 'John',
          age: '17',
          nested: {prop: 'foo'},
        })
        .toJSON()

      expect(results.errors).toHaveLength(1)
      expect(results.errors[0]).toEqual({path: ['email'], message: 'expected value to be defined'})
      expect(results.value.updatedAt).toBeInstanceOf(Date)
      expect(results.value.nested.prop).toMatch(/[a-f0-9]+/)

      expect(results.value).toMatchObject({
        id: 12,
        name: 'John',
        age: 17,
        email: undefined, // invalid
        checksum: '85John',
        pristine: false,
      })
    })
  })
})
