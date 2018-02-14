const expect = require('chai').expect
const _ = require('lodash')
const ModelContext = require('klay').ModelContext
const helpers = require('../lib-ts/helpers')
const DatabaseExtension = require('../lib-ts/extension').DatabaseExtension
const DatabaseOptions = require('../lib-ts/options').DatabaseOptions

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
      expect(prefixed)
        .to.have.nested.property('automanage.0.property')
        .eql(['x', 'nested'])
      expect(prefixed)
        .to.have.nested.property('constrain.0.properties')
        .eql([['x', 'nested'], ['x', 'other']])
      expect(prefixed)
        .to.have.nested.property('index.0.0.property')
        .eql(['x', 'nested'])
      expect(prefixed)
        .to.have.nested.property('index.1')
        .eql([{property: ['x'], direction: 'asc'}])
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
        email: context.email().constrain({type: 'unique'}),
        updatedAt: context
          .date()
          .index([{property: [], direction: 'desc'}])
          .automanage({...AUTOMANAGE, supplyWith: 'iso-timestamp'}),
      })

      children = model.spec.children
    })

    it('should preserve root spec', () => {
      const index = [{property: ['foo'], direction: 'asc'}]
      const root = {index: [index]}
      const results = helpers.mergeChildrenIntoRoot(root, [])
      expect(results).to.equal(root)
      expect(results).to.eql({index: [index]})
    })

    it('should collect db options from children', () => {
      const results = helpers.mergeChildrenIntoRoot({}, children)
      expect(results.automanage).to.have.length(2)
      expect(results.constrain).to.have.length(2)
      expect(results.index).to.have.length(1)
    })

    it('should be idempotent', () => {
      let results = helpers.mergeChildrenIntoRoot({}, children)
      expect(results.automanage).to.have.length(2)
      expect(results.constrain).to.have.length(2)
      expect(results.index).to.have.length(1)

      results = helpers.mergeChildrenIntoRoot({}, children)
      expect(results.automanage).to.have.length(2)
      expect(results.constrain).to.have.length(2)
      expect(results.index).to.have.length(1)
    })

    it('should replace property names', () => {
      const results = helpers.mergeChildrenIntoRoot({}, children)
      expect(results)
        .to.have.nested.property('index.0.0.property')
        .eql(['updatedAt'])

      expect(results)
        .to.have.nested.property('constrain.0.properties.0')
        .eql(['id'])
      expect(results).to.have.nested.property('constrain.0.name', 'primary:id')
      expect(results)
        .to.have.nested.property('constrain.1.properties.0')
        .eql(['email'])
      expect(results).to.have.nested.property('constrain.1.name', 'unique:email')

      expect(results)
        .to.have.nested.property('automanage.0.property')
        .eql(['id'])
      expect(results)
        .to.have.nested.property('automanage.1.property')
        .eql(['updatedAt'])
    })
  })

  describe('#getModelForEvent', () => {
    let model

    beforeEach(() => {
      const extension = new DatabaseExtension()
      const context = ModelContext.create()
        .use(extension)
        .use({defaults: {required: true}})
      const checksum = value => (value.age * 5) + value.name
      model = context.object().children({
        id: context
          .integer()
          .constrain({type: 'primary'})
          .autoIncrement(),
        email: context.email().constrain({type: 'unique'}),
        age: context.integer(),
        name: context.string(),
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
        createdAt: context.date().automanage({
          property: [],
          event: 'create',
          phase: 'parse',
          supplyWith: 'iso-timestamp',
        }).optional(),
        updatedAt: context.date().automanage({
          property: [],
          event: '*',
          phase: 'parse',
          supplyWith: 'iso-timestamp',
        }).optional(),
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

      expect(results.value.createdAt).to.be.instanceof(Date)
      expect(results.value.updatedAt).to.be.instanceof(Date)

      const value = _.omit(results.value, ['createdAt', 'updatedAt'])
      expect(value).to.eql({
        id: undefined, // should be filled by database
        name: 'John',
        age: 17,
        email: 'john@example.com', // invalid
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
        })
        .toJSON()

      expect(results.errors).to.have.length(1)
      expect(results.errors[0]).to.eql({path: ['email'], message: 'expected value to be defined'})
      expect(results.value.updatedAt).to.be.instanceof(Date)

      const value = _.omit(results.value, ['createdAt', 'updatedAt'])
      expect(value).to.eql({
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
