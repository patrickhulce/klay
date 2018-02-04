/* eslint-disable max-nested-callbacks */
const expect = require('chai').expect
const extension = require('../../lib-ts/extensions/core')
const vr = require('../utils').createValidationResult

const coercions = extension.coerce
const validations = extension.validations

describe('lib/extensions/core.ts', () => {
  describe('coerce', () => {
    describe('boolean', () => {
      const coerce = coercions.boolean.___ALL_FORMATS___['coerce-type']

      it('should coerce type', () => {
        expect(coerce(vr(true), {})).to.include({conforms: true, value: true})
        expect(coerce(vr('true'), {})).to.include({conforms: true, value: true})
        expect(coerce(vr(false), {})).to.include({conforms: true, value: false})
        expect(coerce(vr('false'), {})).to.include({conforms: true, value: false})
        expect(() => coerce(vr(undefined), {})).to.throw()
        expect(() => coerce(vr(0), {})).to.throw()
        expect(() => coerce(vr(''), {})).to.throw()
        expect(() => coerce(vr(null), {})).to.throw()
      })

      it('should not coerce type when strict is true', () => {
        const spec = {strict: true}
        expect(coerce(vr(true), spec)).to.include({conforms: true, value: true})
        expect(coerce(vr(false), spec)).to.include({conforms: true, value: false})
        expect(() => coerce(vr('false'), spec)).to.throw()
        expect(() => coerce(vr('true'), spec)).to.throw()
        expect(() => coerce(vr(undefined), spec)).to.throw()
        expect(() => coerce(vr(0), spec)).to.throw()
        expect(() => coerce(vr(''), spec)).to.throw()
        expect(() => coerce(vr(null), spec)).to.throw()
      })
    })

    describe('number', () => {
      const coerce = coercions.number.___ALL_FORMATS___['coerce-type']

      it('should coerce type', () => {
        expect(coerce(vr(1.2), {})).to.include({conforms: true, value: 1.2})
        expect(coerce(vr('5.1'), {})).to.include({conforms: true, value: 5.1})
        expect(coerce(vr('3.0'), {})).to.include({conforms: true, value: 3})
        expect(coerce(vr(0), {})).to.include({conforms: true, value: 0})
        expect(coerce(vr(Infinity), {})).to.include({conforms: true, value: Infinity})
        expect(() => coerce(vr(undefined), {})).to.throw()
        expect(() => coerce(vr('1 / 5'), {})).to.throw()
        expect(() => coerce(vr(''), {})).to.throw()
        expect(() => coerce(vr(null), {})).to.throw()
      })

      it('should not coerce type when strict is true', () => {
        const spec = {strict: true}
        expect(coerce(vr(1.2), spec)).to.include({conforms: true, value: 1.2})
        expect(coerce(vr(0), spec)).to.include({conforms: true, value: 0})
        expect(coerce(vr(Infinity), spec)).to.include({conforms: true, value: Infinity})
        expect(() => coerce(vr(undefined), spec)).to.throw()
        expect(() => coerce(vr('5.1'), spec)).to.throw()
        expect(() => coerce(vr('3'), spec)).to.throw()
        expect(() => coerce(vr('1 / 5'), spec)).to.throw()
        expect(() => coerce(vr(''), spec)).to.throw()
        expect(() => coerce(vr(null), spec)).to.throw()
      })
    })

    describe('string', () => {
      const coerce = coercions.string.___ALL_FORMATS___['coerce-type']

      it('should coerce type', () => {
        expect(coerce(vr(1.2), {})).to.include({conforms: true, value: '1.2'})
        expect(coerce(vr(''), {})).to.include({conforms: true, value: ''})
        expect(coerce(vr(false), {})).to.include({conforms: true, value: 'false'})
        expect(coerce(vr('hello'), {})).to.include({conforms: true, value: 'hello'})
        expect(() => coerce(vr(undefined), {})).to.throw()
        expect(() => coerce(vr(null), {})).to.throw()
        expect(() => coerce(vr({}), {})).to.throw()
        expect(() => coerce(vr([]), {})).to.throw()
      })

      it('should not coerce type when strict is true', () => {
        const spec = {strict: true}
        expect(coerce(vr(''), spec)).to.include({conforms: true, value: ''})
        expect(coerce(vr('hello'), spec)).to.include({conforms: true, value: 'hello'})
        expect(() => coerce(vr(1.2), spec)).to.throw()
        expect(() => coerce(vr(false), spec)).to.throw()
        expect(() => coerce(vr(undefined), spec)).to.throw()
        expect(() => coerce(vr(null), spec)).to.throw()
        expect(() => coerce(vr({}), spec)).to.throw()
        expect(() => coerce(vr([]), spec)).to.throw()
      })
    })

    describe('object', () => {
      const coerce = coercions.object.___ALL_FORMATS___['coerce-type']

      it('should coerce type', () => {
        expect(coerce(vr(null), {})).to.include({conforms: true, value: null})
        expect(coerce(vr('{}'), {})).to.deep.include({conforms: true, value: {}})
        expect(coerce(vr('null'), {})).to.include({conforms: true, value: null})
        expect(coerce(vr({x: 1}), {})).to.deep.include({conforms: true, value: {x: 1}})
        expect(() => coerce(vr(undefined), {})).to.throw()
        expect(() => coerce(vr(0), {})).to.throw()
        expect(() => coerce(vr(''), {})).to.throw()
        expect(() => coerce(vr('what'), {})).to.throw()
        expect(() => coerce(vr(false), {})).to.throw()
        expect(() => coerce(vr([]), {})).to.throw()
      })

      it('should not coerce type when strict is true', () => {
        const spec = {strict: true}
        expect(coerce(vr(null), spec)).to.include({conforms: true, value: null})
        expect(coerce(vr({x: 1}), spec)).to.deep.include({conforms: true, value: {x: 1}})
        expect(() => coerce(vr('{}'), spec)).to.throw()
        expect(() => coerce(vr('null'), spec)).to.throw()
        expect(() => coerce(vr(undefined), spec)).to.throw()
        expect(() => coerce(vr(0), spec)).to.throw()
        expect(() => coerce(vr(''), spec)).to.throw()
        expect(() => coerce(vr('what'), spec)).to.throw()
        expect(() => coerce(vr(false), spec)).to.throw()
        expect(() => coerce(vr([]), spec)).to.throw()
      })
    })

    describe('array', () => {
      const coerce = coercions.array.___ALL_FORMATS___['coerce-type']

      it('should coerce type', () => {
        expect(coerce(vr([]), {})).to.deep.include({conforms: true, value: []})
        expect(coerce(vr([1, 2]), {})).to.deep.include({conforms: true, value: [1, 2]})
        expect(coerce(vr('[]'), {})).to.deep.include({conforms: true, value: []})
        expect(() => coerce(vr(undefined), {})).to.throw()
        expect(() => coerce(vr(0), {})).to.throw()
        expect(() => coerce(vr(''), {})).to.throw()
        expect(() => coerce(vr(null), {})).to.throw()
        expect(() => coerce(vr({}), {})).to.throw()
      })

      it('should not coerce type when strict is true', () => {
        const spec = {strict: true}
        expect(coerce(vr([]), spec)).to.deep.include({conforms: true, value: []})
        expect(coerce(vr([1, 2]), spec)).to.deep.include({conforms: true, value: [1, 2]})
        expect(() => coerce(vr(undefined), spec)).to.throw()
        expect(() => coerce(vr(0), spec)).to.throw()
        expect(() => coerce(vr(''), spec)).to.throw()
        expect(() => coerce(vr('[]'), spec)).to.throw()
        expect(() => coerce(vr(null), spec)).to.throw()
        expect(() => coerce(vr({}), spec)).to.throw()
      })
    })
  })

  describe('validations', () => {
    let validate

    describe('number', () => {
      beforeEach(() => {
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
    })

    describe('string', () => {
      beforeEach(() => {
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
})
