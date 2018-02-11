const expect = require('chai').expect
const ModelContext = require('klay').ModelContext
const helpers = require('../lib-ts/helpers')
const DatabaseExtension = require('../lib-ts/extension').DatabaseExtension
const DatabaseOptions = require('../lib-ts/options').DatabaseOptions

const AUTOMANAGE = {property: [], event: '*', phase: 'delegate', supplyWith: 'auto-increment'}
const CONSTRAINT = {properties: [[]], type: 'unique'}

describe.only('lib/helpers.ts', () => {
  describe('#addPropertyNames', () => {
    it('adds names to spec properties', () => {
      const options = new DatabaseOptions()
        .automanage({...AUTOMANAGE, property: ['nested']})
        .constraint({...CONSTRAINT, properties: [['nested'], ['other']]})
        .index([['nested']])
        .index([[]])

      const prefixed = helpers.addPropertyNames(options.spec, 'x')
      expect(prefixed)
        .to.have.nested.property('automanage.0.property')
        .eql(['x', 'nested'])
      expect(prefixed)
        .to.have.nested.property('constraint.0.properties')
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
          .primaryKey()
          .autoIncrement(),
        email: context.email().unique(),
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
      expect(results.constraint).to.have.length(2)
      expect(results.index).to.have.length(1)
    })

    it('should be idempotent', () => {
      let results = helpers.mergeChildrenIntoRoot({}, children)
      expect(results.automanage).to.have.length(2)
      expect(results.constraint).to.have.length(2)
      expect(results.index).to.have.length(1)

      results = helpers.mergeChildrenIntoRoot({}, children)
      expect(results.automanage).to.have.length(2)
      expect(results.constraint).to.have.length(2)
      expect(results.index).to.have.length(1)
    })

    it('should replace property names', () => {
      const results = helpers.mergeChildrenIntoRoot({}, children)
      expect(results)
        .to.have.nested.property('index.0.0.property')
        .eql(['updatedAt'])

      expect(results)
        .to.have.nested.property('constraint.0.properties.0')
        .eql(['id'])
      expect(results).to.have.nested.property('constraint.0.name', 'primary:id')
      expect(results)
        .to.have.nested.property('constraint.1.properties.0')
        .eql(['email'])
      expect(results).to.have.nested.property('constraint.1.name', 'unique:email')

      expect(results)
        .to.have.nested.property('automanage.0.property')
        .eql(['id'])
      expect(results)
        .to.have.nested.property('automanage.1.property')
        .eql(['updatedAt'])
    })
  })
})
