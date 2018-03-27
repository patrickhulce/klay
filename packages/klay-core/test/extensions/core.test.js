/* eslint-disable max-nested-callbacks */
const extension = require('../../lib/extensions/core')
const vr = require('../utils').createValidationResult

const coercions = extension.coerce
const validations = extension.validations

describe('lib/extensions/core.ts', () => {
  describe('coerce', () => {
    describe('undefined', () => {
      const coerce = coercions.undefined.___ALL_FORMATS___['coerce-type']

      it('should coerce type', () => {
        expect(coerce(vr(undefined), {})).toMatchObject({conforms: true, value: undefined})
        expect(() => coerce(vr('hello'), {})).toThrowError()
        expect(() => coerce(vr({}), {})).toThrowError()
        expect(() => coerce(vr(0), {})).toThrowError()
        expect(() => coerce(vr(''), {})).toThrowError()
        expect(() => coerce(vr(null), {})).toThrowError()
      })
    })

    describe('boolean', () => {
      const coerce = coercions.boolean.___ALL_FORMATS___['coerce-type']

      it('should coerce type', () => {
        expect(coerce(vr(true), {})).toMatchObject({conforms: true, value: true})
        expect(coerce(vr('true'), {})).toMatchObject({conforms: true, value: true})
        expect(coerce(vr(false), {})).toMatchObject({conforms: true, value: false})
        expect(coerce(vr('false'), {})).toMatchObject({conforms: true, value: false})
        expect(() => coerce(vr(undefined), {})).toThrowError()
        expect(() => coerce(vr(0), {})).toThrowError()
        expect(() => coerce(vr(''), {})).toThrowError()
        expect(() => coerce(vr(null), {})).toThrowError()
      })

      it('should not coerce type when strict is true', () => {
        const spec = {strict: true}
        expect(coerce(vr(true), spec)).toMatchObject({conforms: true, value: true})
        expect(coerce(vr(false), spec)).toMatchObject({conforms: true, value: false})
        expect(() => coerce(vr('false'), spec)).toThrowError()
        expect(() => coerce(vr('true'), spec)).toThrowError()
        expect(() => coerce(vr(undefined), spec)).toThrowError()
        expect(() => coerce(vr(0), spec)).toThrowError()
        expect(() => coerce(vr(''), spec)).toThrowError()
        expect(() => coerce(vr(null), spec)).toThrowError()
      })
    })

    describe('number', () => {
      const coerce = coercions.number.___ALL_FORMATS___['coerce-type']

      it('should coerce type', () => {
        expect(coerce(vr(1.2), {})).toMatchObject({conforms: true, value: 1.2})
        expect(coerce(vr('5.1'), {})).toMatchObject({conforms: true, value: 5.1})
        expect(coerce(vr('3.0'), {})).toMatchObject({conforms: true, value: 3})
        expect(coerce(vr(0), {})).toMatchObject({conforms: true, value: 0})
        expect(coerce(vr(Infinity), {})).toMatchObject({conforms: true, value: Infinity})
        expect(() => coerce(vr(undefined), {})).toThrowError()
        expect(() => coerce(vr('1 / 5'), {})).toThrowError()
        expect(() => coerce(vr(''), {})).toThrowError()
        expect(() => coerce(vr(null), {})).toThrowError()
      })

      it('should not coerce type when strict is true', () => {
        const spec = {strict: true}
        expect(coerce(vr(1.2), spec)).toMatchObject({conforms: true, value: 1.2})
        expect(coerce(vr(0), spec)).toMatchObject({conforms: true, value: 0})
        expect(coerce(vr(Infinity), spec)).toMatchObject({conforms: true, value: Infinity})
        expect(() => coerce(vr(undefined), spec)).toThrowError()
        expect(() => coerce(vr('5.1'), spec)).toThrowError()
        expect(() => coerce(vr('3'), spec)).toThrowError()
        expect(() => coerce(vr('1 / 5'), spec)).toThrowError()
        expect(() => coerce(vr(''), spec)).toThrowError()
        expect(() => coerce(vr(null), spec)).toThrowError()
      })
    })

    describe('string', () => {
      const coerce = coercions.string.___ALL_FORMATS___['coerce-type']

      it('should coerce type', () => {
        expect(coerce(vr(1.2), {})).toMatchObject({conforms: true, value: '1.2'})
        expect(coerce(vr(''), {})).toMatchObject({conforms: true, value: ''})
        expect(coerce(vr(false), {})).toMatchObject({conforms: true, value: 'false'})
        expect(coerce(vr('hello'), {})).toMatchObject({conforms: true, value: 'hello'})
        expect(() => coerce(vr(undefined), {})).toThrowError()
        expect(() => coerce(vr(null), {})).toThrowError()
        expect(() => coerce(vr({}), {})).toThrowError()
        expect(() => coerce(vr([]), {})).toThrowError()
      })

      it('should not coerce type when strict is true', () => {
        const spec = {strict: true}
        expect(coerce(vr(''), spec)).toMatchObject({conforms: true, value: ''})
        expect(coerce(vr('hello'), spec)).toMatchObject({conforms: true, value: 'hello'})
        expect(() => coerce(vr(1.2), spec)).toThrowError()
        expect(() => coerce(vr(false), spec)).toThrowError()
        expect(() => coerce(vr(undefined), spec)).toThrowError()
        expect(() => coerce(vr(null), spec)).toThrowError()
        expect(() => coerce(vr({}), spec)).toThrowError()
        expect(() => coerce(vr([]), spec)).toThrowError()
      })
    })

    describe('object', () => {
      const coerce = coercions.object.___ALL_FORMATS___['coerce-type']

      it('should coerce type', () => {
        expect(coerce(vr(null), {})).toMatchObject({conforms: true, value: null})
        expect(coerce(vr('{}'), {})).toMatchObject({conforms: true, value: {}})
        expect(coerce(vr('null'), {})).toMatchObject({conforms: true, value: null})
        expect(coerce(vr({x: 1}), {})).toMatchObject({conforms: true, value: {x: 1}})
        expect(() => coerce(vr(undefined), {})).toThrowError()
        expect(() => coerce(vr(0), {})).toThrowError()
        expect(() => coerce(vr(''), {})).toThrowError()
        expect(() => coerce(vr('what'), {})).toThrowError()
        expect(() => coerce(vr(false), {})).toThrowError()
        expect(() => coerce(vr([]), {})).toThrowError()
      })

      it('should not coerce type when strict is true', () => {
        const spec = {strict: true}
        expect(coerce(vr(null), spec)).toMatchObject({conforms: true, value: null})
        expect(coerce(vr({x: 1}), spec)).toMatchObject({conforms: true, value: {x: 1}})
        expect(() => coerce(vr('{}'), spec)).toThrowError()
        expect(() => coerce(vr('null'), spec)).toThrowError()
        expect(() => coerce(vr(undefined), spec)).toThrowError()
        expect(() => coerce(vr(0), spec)).toThrowError()
        expect(() => coerce(vr(''), spec)).toThrowError()
        expect(() => coerce(vr('what'), spec)).toThrowError()
        expect(() => coerce(vr(false), spec)).toThrowError()
        expect(() => coerce(vr([]), spec)).toThrowError()
      })
    })

    describe('array', () => {
      const coerce = coercions.array.___ALL_FORMATS___['coerce-type']

      it('should coerce type', () => {
        expect(coerce(vr([]), {})).toMatchObject({conforms: true, value: []})
        expect(coerce(vr([1, 2]), {})).toMatchObject({conforms: true, value: [1, 2]})
        expect(coerce(vr('[]'), {})).toMatchObject({conforms: true, value: []})
        expect(() => coerce(vr(undefined), {})).toThrowError()
        expect(() => coerce(vr(0), {})).toThrowError()
        expect(() => coerce(vr(''), {})).toThrowError()
        expect(() => coerce(vr(null), {})).toThrowError()
        expect(() => coerce(vr({}), {})).toThrowError()
      })

      it('should not coerce type when strict is true', () => {
        const spec = {strict: true}
        expect(coerce(vr([]), spec)).toMatchObject({conforms: true, value: []})
        expect(coerce(vr([1, 2]), spec)).toMatchObject({conforms: true, value: [1, 2]})
        expect(() => coerce(vr(undefined), spec)).toThrowError()
        expect(() => coerce(vr(0), spec)).toThrowError()
        expect(() => coerce(vr(''), spec)).toThrowError()
        expect(() => coerce(vr('[]'), spec)).toThrowError()
        expect(() => coerce(vr(null), spec)).toThrowError()
        expect(() => coerce(vr({}), spec)).toThrowError()
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
        expect(() => validate({value: 10}, {min: 1})).not.toThrowError()
        expect(() => validate({value: 1}, {min: 1})).not.toThrowError()
        expect(() => validate({value: -1}, {min: 1})).toThrowError()
      })

      it('should validate max', () => {
        expect(() => validate({value: 10}, {max: 1})).toThrowError()
        expect(() => validate({value: 1}, {max: 1})).not.toThrowError()
        expect(() => validate({value: -1}, {max: 1})).not.toThrowError()
      })

      it('should validate min and max', () => {
        expect(() => validate({value: 11}, {min: 1, max: 10})).toThrowError()
        expect(() => validate({value: 10}, {min: 1, max: 10})).not.toThrowError()
        expect(() => validate({value: 1}, {min: 1, max: 10})).not.toThrowError()
        expect(() => validate({value: -1}, {min: 1, max: 10})).toThrowError()
      })
    })

    describe('string', () => {
      beforeEach(() => {
        validate = validations.string.___ALL_FORMATS___[0]
      })

      it('should validate min', () => {
        expect(() => validate({value: '123'}, {min: 4})).toThrowError()
        expect(() => validate({value: '1234'}, {min: 4})).not.toThrowError()
        expect(() => validate({value: '12345'}, {min: 4})).not.toThrowError()
      })

      it('should validate max', () => {
        expect(() => validate({value: '123'}, {max: 4})).not.toThrowError()
        expect(() => validate({value: '1234'}, {max: 4})).not.toThrowError()
        expect(() => validate({value: '12345'}, {max: 4})).toThrowError()
      })
    })

    describe('object', () => {
      const validateMinMax = validations.object.___ALL_FORMATS___[0]
      const validateKeys = validations.object.___ALL_FORMATS___[1]

      it('should validate min', () => {
        expect(() => validateMinMax({value: {}}, {min: 2})).toThrowError()
        expect(() => validateMinMax({value: {x: 1, y: 2}}, {min: 2})).not.toThrowError()
        expect(() => validateMinMax({value: {x: 1, y: 2, z: 3}}, {min: 2})).not.toThrowError()
      })

      it('should validate max', () => {
        expect(() => validateMinMax({value: {}}, {max: 2})).not.toThrowError()
        expect(() => validateMinMax({value: {x: 1, y: 2}}, {max: 2})).not.toThrowError()
        expect(() => validateMinMax({value: {x: 1, y: 2, z: 3}}, {max: 2})).toThrowError()
      })

      it('should not validate keys when strict is true', () => {
        expect(() => validateKeys({value: {x: 1}}, {})).not.toThrowError()
        expect(() => validateKeys({value: {x: 1}}, {strict: true})).not.toThrowError()
      })

      it('should validate keys when strict is true and children exist', () => {
        const children = [{path: 'x'}, {path: 'y'}, {path: 'z'}]
        const options = {strict: true, children}
        expect(() => validateKeys({value: {x: 1}}, options)).not.toThrowError()
        expect(() => validateKeys({value: {x: 1, y: 2, z: 3}}, options)).not.toThrowError()
        const msg = 'unexpected properties: a, b'
        expect(() => validateKeys({value: {x: 1, a: 1, b: 2}}, options)).toThrowError(msg)
      })
    })

    describe('array', () => {
      beforeEach(() => {
        validate = validations.array.___ALL_FORMATS___[0]
      })

      it('should validate min', () => {
        expect(() => validate({value: []}, {min: 2})).toThrowError()
        expect(() => validate({value: [1, 2]}, {min: 2})).not.toThrowError()
        expect(() => validate({value: [1, 2, 3]}, {min: 2})).not.toThrowError()
      })

      it('should validate max', () => {
        expect(() => validate({value: []}, {max: 2})).not.toThrowError()
        expect(() => validate({value: [1, 2]}, {max: 2})).not.toThrowError()
        expect(() => validate({value: [1, 2, 3]}, {max: 2})).toThrowError()
      })
    })

    describe('date', () => {
      beforeEach(() => {
        validate = validations.date.___ALL_FORMATS___[0]
      })

      it('should validate min', () => {
        const dateJan = new Date(2018, 1, 1)
        const dateFeb = new Date(2018, 2, 1)
        const dateMar = new Date(2018, 3, 1)
        const min = dateFeb.getTime()
        expect(() => validate({value: dateJan}, {min})).toThrowError()
        expect(() => validate({value: dateFeb}, {min})).not.toThrowError()
        expect(() => validate({value: dateMar}, {min})).not.toThrowError()
      })

      it('should validate max', () => {
        const dateJan = new Date(2018, 1, 1)
        const dateFeb = new Date(2018, 2, 1)
        const dateMar = new Date(2018, 3, 1)
        const max = dateFeb.getTime()
        expect(() => validate({value: dateJan}, {max})).not.toThrowError()
        expect(() => validate({value: dateFeb}, {max})).not.toThrowError()
        expect(() => validate({value: dateMar}, {max})).toThrowError()
      })
    })
  })
})
