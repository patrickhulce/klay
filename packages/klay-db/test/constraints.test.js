const _ = require('lodash')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const chaiSinon = require('sinon-chai')
const sinon = require('sinon')
const {
  getPrimaryKey,
  fetchByUniqueConstraints,
  evaluateUniqueConstraints,
  evaluateCustomConstraints,
} = require('../dist/constraints')

const expect = chai.expect
chai.use(chaiAsPromised)
chai.use(chaiSinon)

describe('lib/constraints.ts', () => {
  let executor, executorData

  beforeEach(() => {
    executor = {
      findOne(query) {
        return _.filter(executorData, query.where)[0]
      },
    }
  })

  describe('getPrimaryKey', () => {
    it('should get the primary key', () => {
      const constraint = {type: 'primary', properties: [['id']]}
      const model = {spec: {db: {constrain: [constraint]}}}
      const pk = getPrimaryKey(model, {id: 1})
      expect(pk).to.equal(1)
    })

    it('should throw on invalid constrain', () => {
      const model = {spec: {db: {constrain: []}}}
      expect(() => getPrimaryKey(model, {})).to.throw(/missing primary key/)
    })
  })

  describe('fetchByUniqueConstraints', () => {
    it('should return nothing when none match', async () => {
      executorData = [{id: 1, x: 1}, {id: 2, x: 2}]
      const constraint = {type: 'unique', properties: [['x']]}
      const model = {spec: {db: {constrain: [constraint]}}}
      expect(await fetchByUniqueConstraints(executor, model, {x: 3})).to.eql(undefined)
      model.spec.db.constrain = []
      expect(await fetchByUniqueConstraints(executor, model, {x: 1})).to.eql(undefined)
    })

    it('should find the matching record', async () => {
      executorData = [{id: 1, x: 1}, {id: 2, x: 2}]
      const constraint = {type: 'unique', properties: [['x']]}
      const model = {spec: {db: {constrain: [constraint]}}}
      const result = await fetchByUniqueConstraints(executor, model, {x: 2})
      expect(result).to.eql({id: 2, x: 2})
    })

    it('should find the multi-matching record', async () => {
      executorData = [{id: 1, x: 1, y: 1}, {id: 2, x: 1, y: 2}]
      const constraint = {type: 'unique', properties: [['x'], ['y']]}
      const model = {spec: {db: {constrain: [constraint]}}}
      const result = await fetchByUniqueConstraints(executor, model, {x: 1, y: 2})
      expect(result).to.eql({id: 2, x: 1, y: 2})
    })
  })

  describe('evaluateUniqueConstraints', () => {
    it('should validate unique constraints', async () => {
      executorData = [{id: 1, x: 1}, {id: 2, x: 2}]
      const primary = {type: 'primary', properties: [['id']]}
      const unique = {type: 'unique', properties: [['x']]}
      const model = {spec: {db: {constrain: [primary, unique]}}}
      const resultA = evaluateUniqueConstraints(executor, model, {x: 2})
      await expect(resultA).to.be.rejectedWith(/constraint.*violated/)
      const resultB = evaluateUniqueConstraints(executor, model, {id: 1, x: 2})
      await expect(resultB).to.be.rejectedWith(/constraint.*violated/)
      const resultC = await evaluateUniqueConstraints(executor, model, {id: 2, x: 2})
      expect(resultC).to.eql(undefined)
    })
  })

  describe('evaluateCustomConstraints', () => {
    it('should validate custom constraints', async () => {
      const evaluateA = sinon.spy()
      const evaluateB = sinon.spy()
      const customA = {type: 'custom', properties: [[]], meta: {evaluate: evaluateA}}
      const customB = {type: 'custom', properties: [[]], meta: {evaluate: evaluateB}}
      const model = {spec: {db: {constrain: [customA, customB]}}}
      await evaluateCustomConstraints(executor, model, {x: 2}, {x: 1}, 'create')
      expect(evaluateA.callCount).to.equal(1)
      expect(evaluateB.callCount).to.equal(1)

      const args = evaluateA.firstCall.args[0]
      expect(args.record).to.eql({x: 2})
      expect(args.existing).to.eql({x: 1})
      expect(args.model).to.equal(model)
      expect(args.executor).to.equal(executor)
      expect(args.event).to.equal('create')
      expect(args.constraint).to.equal(customA)
    })
  })
})
