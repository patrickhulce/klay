const expect = require('chai').expect
const Model = require('../lib-ts/model').Model

describe('model.ts', () => {
  describe('#constructor', () => {
    it('should construct a model', () => {
      expect(() => new Model({}, {types: []})).to.not.throw()
    })
  })

  describe('.type', () => {
    it('should set spec.type', () => {
      const model = new Model({}, {types: ['string']}).type('string')
      expect(model.spec.type).to.equal('string')
    })

    it('should throw on unacceptable type', () => {
      expect(() => new Model({}, {types: []}).type('string')).to.throw()
    })
  })
})
