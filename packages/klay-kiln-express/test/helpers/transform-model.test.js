const expect = require('chai').expect
const transforms = require('../../dist/helpers/transform-model')
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
      expect(result).to.eql({conforms: true, value: {id: 12}, errors: []})
    })
  })

  describe('#creatifyModel', () => {
    it('should omit automanaged properties', () => {
      const transformed = transforms.creatifyModel(model)
      const properties = transformed.spec.children.map(child => child.path)
      const trackingProperties = transformed.spec.children
        .find(child => child.path === 'tracking')
        .model.spec.children.map(child => child.path)
      expect(properties).to.not.include('id')
      expect(trackingProperties).to.not.include('trackingId')
    })
  })

  describe('#updatifyModel', () => {
    it('should optional automanaged properties', () => {
      const transformed = transforms.updateifyModel(model)
      const updatedAt = transformed.spec.children.find(child => child.path === 'updatedAt')
      expect(updatedAt).to.have.nested.property('model.spec.required', false)

      const tracking = transformed.spec.children.find(child => child.path === 'tracking')
      const trackingId = tracking.model.spec.children.find(child => child.path === 'trackingId')
      expect(trackingId).to.have.nested.property('model.spec.required', false)
    })
  })

  describe('#querifyModel', () => {
    it('should convert values to equality filter', () => {
      const transformed = transforms.querifyModel(model, {allowQueryByEquality: true})
      const result = transformed.validate({age: 10})
      expect(result.value.age).to.include({$eq: 10})
    })

    it('should loosen strict settings', () => {
      const transformed = transforms.querifyModel(model, {allowQueryByEquality: true})
      const result = transformed.validate({age: '10'})
      expect(result.value.age).to.include({$eq: 10})
    })
  })
})
