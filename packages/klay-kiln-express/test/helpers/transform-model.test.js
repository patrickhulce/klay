const expect = require('chai').expect
const transforms = require('../../dist/helpers/transform-model')
const utils = require('../utils')

describe('lib/helpers/transform-model.ts', () => {
  let model

  beforeEach(() => {
    model = utils.state().model
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
})
