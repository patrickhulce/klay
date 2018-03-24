const _ = require('lodash')
const {
  getPrimaryKey,
  fetchByUniqueConstraints,
  evaluateUniqueConstraints,
  evaluateCustomConstraints,
} = require('../dist/constraints')

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
      expect(pk).toBe(1)
    })

    it('should throw on invalid constrain', () => {
      const model = {spec: {db: {constrain: []}}}
      expect(() => getPrimaryKey(model, {})).toThrowError(/missing primary key/)
    })
  })

  describe('fetchByUniqueConstraints', () => {
    it('should return nothing when none match', async () => {
      executorData = [{id: 1, x: 1}, {id: 2, x: 2}]
      const constraint = {type: 'unique', properties: [['x']]}
      const model = {spec: {db: {constrain: [constraint]}}}
      expect(await fetchByUniqueConstraints(executor, model, {x: 3})).toEqual(undefined)
      model.spec.db.constrain = []
      expect(await fetchByUniqueConstraints(executor, model, {x: 1})).toEqual(undefined)
    })

    it('should find the matching record', async () => {
      executorData = [{id: 1, x: 1}, {id: 2, x: 2}]
      const constraint = {type: 'unique', properties: [['x']]}
      const model = {spec: {db: {constrain: [constraint]}}}
      const result = await fetchByUniqueConstraints(executor, model, {x: 2})
      expect(result).toEqual({id: 2, x: 2})
    })

    it('should find the multi-matching record', async () => {
      executorData = [{id: 1, x: 1, y: 1}, {id: 2, x: 1, y: 2}]
      const constraint = {type: 'unique', properties: [['x'], ['y']]}
      const model = {spec: {db: {constrain: [constraint]}}}
      const result = await fetchByUniqueConstraints(executor, model, {x: 1, y: 2})
      expect(result).toEqual({id: 2, x: 1, y: 2})
    })
  })

  describe('evaluateUniqueConstraints', () => {
    it('should validate unique constraints', async () => {
      executorData = [{id: 1, x: 1}, {id: 2, x: 2}]
      const primary = {type: 'primary', properties: [['id']]}
      const unique = {type: 'unique', properties: [['x']]}
      const model = {spec: {db: {constrain: [primary, unique]}}}
      const resultA = evaluateUniqueConstraints(executor, model, {x: 2})
      await expect(resultA).rejects.toThrow(/constraint.*violated/)
      const resultB = evaluateUniqueConstraints(executor, model, {id: 1, x: 2})
      await expect(resultB).rejects.toThrow(/constraint.*violated/)
      const resultC = await evaluateUniqueConstraints(executor, model, {id: 2, x: 2})
      expect(resultC).toEqual(undefined)
    })
  })

  describe('evaluateCustomConstraints', () => {
    it('should validate custom constraints', async () => {
      const evaluateA = jest.fn()
      const evaluateB = jest.fn()
      const customA = {type: 'custom', properties: [[]], meta: {evaluate: evaluateA}}
      const customB = {type: 'custom', properties: [[]], meta: {evaluate: evaluateB}}
      const model = {spec: {db: {constrain: [customA, customB]}}}
      await evaluateCustomConstraints(executor, model, {x: 2}, {x: 1}, 'create')
      expect(evaluateA).toHaveBeenCalledTimes(1)
      expect(evaluateB).toHaveBeenCalledTimes(1)

      const args = evaluateA.mock.calls[0][0]
      expect(args.record).toEqual({x: 2})
      expect(args.existing).toEqual({x: 1})
      expect(args.model).toBe(model)
      expect(args.executor).toBe(executor)
      expect(args.event).toBe('create')
      expect(args.constraint).toBe(customA)
    })
  })
})
