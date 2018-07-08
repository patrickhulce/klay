const transforms = require('../../lib/helpers/transform-model')
const utils = require('../utils')

describe('lib/helpers/transform-model.ts', () => {
  let model

  beforeEach(() => {
    model = utils.state().model
  })

  describe('#paramifyModel', () => {
    it('should use the ID', () => {
      const modelWithInt = model.clone()
      const idModel = modelWithInt.spec.children.find(child => child.path === 'id').model
      idModel.type('number').format('integer')

      const transformed = transforms.paramifyModel(modelWithInt)
      const result = transformed.validate({id: '12'}).toJSON()
      expect(result).toEqual({conforms: true, value: {id: 12}, errors: []})
    })
  })

  describe('#creatifyModel', () => {
    it('should omit automanaged properties', () => {
      const transformed = transforms.creatifyModel(model)
      const properties = transformed.spec.children.map(child => child.path)
      const trackingProperties = transformed.spec.children
        .find(child => child.path === 'tracking')
        .model.spec.children.map(child => child.path)
      expect(properties).not.toContain('id')
      expect(trackingProperties).not.toContain('trackingId')
    })
  })

  describe('#updatifyModel', () => {
    it('should optional automanaged properties', () => {
      const transformed = transforms.updateifyModel(model)
      const updatedAt = transformed.spec.children.find(child => child.path === 'updatedAt')
      expect(updatedAt).toHaveProperty('model.spec.required', false)

      const tracking = transformed.spec.children.find(child => child.path === 'tracking')
      const trackingId = tracking.model.spec.children.find(child => child.path === 'trackingId')
      expect(trackingId).toHaveProperty('model.spec.required', false)
    })
  })

  describe('#querifyModel', () => {
    it('should strictly validate objects', () => {
      const transformed = transforms.querifyModel(model, {allowQueryByEquality: true})
      const result = transformed.validate({age: {$like: 10}})
      expect(result).toHaveProperty('conforms', false)
    })

    it('should convert values to equality filter', () => {
      const transformed = transforms.querifyModel(model, {allowQueryByEquality: true})
      const result = transformed.validate({age: 10})
      expect(result).toHaveProperty('conforms', true)
      expect(result.value.age).toMatchObject({$eq: 10})
    })

    it('should loosen strict settings', () => {
      const transformed = transforms.querifyModel(model, {allowQueryByEquality: true})
      const result = transformed.validate({age: '10'})
      expect(result.value.age).toMatchObject({$eq: 10})
    })

    it('should support $lt/$gt', () => {
      const transformed = transforms.querifyModel(model, {allowQueryByRange: true})
      const result = transformed.validate({age: {$lt: 'foo', $gte: 90}})
      expect(result).toMatchObject({conforms: false})
      const resultMatch = transformed.validate({age: {$lt: '100', $gte: 90}})
      expect(resultMatch).toHaveProperty('conforms', true)
      expect(resultMatch).toHaveProperty('value.age.$lt', 100)
      expect(resultMatch).toHaveProperty('value.age.$gte', 90)
    })

    it('should support $match', () => {
      const transformed = transforms.querifyModel(model, {allowQueryByEquality: true})
      const result = transformed.validate({id: '.*10'})
      expect(result).toMatchObject({conforms: false})
      const resultMatch = transformed.validate({id: {$match: '.*10'}})
      expect(resultMatch).toHaveProperty('conforms', true)
      expect(resultMatch).toHaveProperty('value.id.$match', '.*10')
    })

    it('should support $in/$nin', () => {
      const transformed = transforms.querifyModel(model, {allowQueryByInclusion: true})
      const result = transformed.validate({age: {$in: [5, 'foo']}})
      expect(result).toMatchObject({conforms: false})
      const resultIn = transformed.validate({age: {$in: [2, 5], $nin: '10, 3'}})
      expect(resultIn).toHaveProperty('conforms', true)
      expect(resultIn).toHaveProperty('value.age.$in', [2, 5])
      expect(resultIn).toHaveProperty('value.age.$nin', [10, 3])
    })
  })
})
