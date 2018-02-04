/* eslint-disable max-nested-callbacks */
const expect = require('chai').expect
const Model = require('../../lib-ts/model').Model
const extension = require('../../lib-ts/extensions/numbers')

const formats = extension.formats
const validations = extension.validations
const methods = extension.methods

describe('lib/extensions/numbers.ts', () => {
  let model, validate

  describe('validations', () => {
    describe('number', () => {
      beforeEach(() => {
        model = new Model({type: 'number'}, {types: ['number'], formats})
        validate = validations.number.___ALL_FORMATS___[0]
      })

      it('should validate min', () => {
        expect(() => validate({value: 10}, {min: 1})).to.not.throw()
        expect(() => validate({value: 1}, {min: 1})).to.not.throw()
        expect(() => validate({value: -1}, {min: 1})).to.throw()
      })

      it('should validate max', () => {
        expect(() => validate({value: 10}, {max: 1})).to.throw()
        expect(() => validate({value: 1}, {max: 1})).to.not.throw()
        expect(() => validate({value: -1}, {max: 1})).to.not.throw()
      })

      it('should validate min and max', () => {
        expect(() => validate({value: 11}, {min: 1, max: 10})).to.throw()
        expect(() => validate({value: 10}, {min: 1, max: 10})).to.not.throw()
        expect(() => validate({value: 1}, {min: 1, max: 10})).to.not.throw()
        expect(() => validate({value: -1}, {min: 1, max: 10})).to.throw()
      })

      it('should validate integers', () => {
        validate = validations.number.integer[0]
        expect(() => validate({value: NaN})).to.throw()
        expect(() => validate({value: 11.1})).to.throw()
        expect(() => validate({value: 10})).to.not.throw()
        expect(() => validate({value: 1})).to.not.throw()
      })

      it('should validate integers', () => {
        validate = validations.number.finite[0]
        expect(() => validate({value: NaN})).to.throw()
        expect(() => validate({value: 11.1})).to.not.throw()
        expect(() => validate({value: 10})).to.not.throw()
        expect(() => validate({value: 1})).to.not.throw()
      })
    })

    describe('string', () => {
      beforeEach(() => {
        model = new Model({type: 'string'}, {types: ['string']})
        validate = validations.string.___ALL_FORMATS___[0]
      })

      it('should validate min', () => {
        expect(() => validate({value: '123'}, {min: 4})).to.throw()
        expect(() => validate({value: '1234'}, {min: 4})).to.not.throw()
        expect(() => validate({value: '12345'}, {min: 4})).to.not.throw()
      })

      it('should validate max', () => {
        expect(() => validate({value: '123'}, {max: 4})).to.not.throw()
        expect(() => validate({value: '1234'}, {max: 4})).to.not.throw()
        expect(() => validate({value: '12345'}, {max: 4})).to.throw()
      })
    })

    describe('object', () => {
      beforeEach(() => {
        model = new Model({type: 'object'}, {types: ['object']})
        validate = validations.object.___ALL_FORMATS___[0]
      })

      it('should validate min', () => {
        expect(() => validate({value: {}}, {min: 2})).to.throw()
        expect(() => validate({value: {x: 1, y: 2}}, {min: 2})).to.not.throw()
        expect(() => validate({value: {x: 1, y: 2, z: 3}}, {min: 2})).to.not.throw()
      })

      it('should validate max', () => {
        expect(() => validate({value: {}}, {max: 2})).to.not.throw()
        expect(() => validate({value: {x: 1, y: 2}}, {max: 2})).to.not.throw()
        expect(() => validate({value: {x: 1, y: 2, z: 3}}, {max: 2})).to.throw()
      })
    })

    describe('array', () => {
      beforeEach(() => {
        model = new Model({type: 'array'}, {types: ['array']})
        validate = validations.array.___ALL_FORMATS___[0]
      })

      it('should validate min', () => {
        expect(() => validate({value: []}, {min: 2})).to.throw()
        expect(() => validate({value: [1, 2]}, {min: 2})).to.not.throw()
        expect(() => validate({value: [1, 2, 3]}, {min: 2})).to.not.throw()
      })

      it('should validate max', () => {
        expect(() => validate({value: []}, {max: 2})).to.not.throw()
        expect(() => validate({value: [1, 2]}, {max: 2})).to.not.throw()
        expect(() => validate({value: [1, 2, 3]}, {max: 2})).to.throw()
      })
    })
  })

  describe('methods', () => {
    beforeEach(() => {
      model = new Model({}, {types: ['number', 'string']})
    })

    it('should set min', () => {
      model = methods.min(model, 2)
      expect(model).to.have.nested.property('spec.min', 2)
    })

    it('should set max', () => {
      model = methods.max(model, 2)
      expect(model).to.have.nested.property('spec.max', 2)
    })

    it('should set size', () => {
      model = methods.size(model, 2)
      expect(model).to.have.nested.property('spec.min', 2)
      expect(model).to.have.nested.property('spec.max', 2)
    })
  })
})
