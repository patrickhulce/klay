/* eslint-disable max-nested-callbacks */
const extension = require('../../dist/extensions/numbers')

const validations = extension.validations

describe('lib/extensions/numbers.ts', () => {
  describe('validations', () => {
    describe('number', () => {
      it('should validate integers', () => {
        const validate = validations.number.integer[0]
        expect(() => validate({value: NaN})).toThrowError()
        expect(() => validate({value: 11.1})).toThrowError()
        expect(() => validate({value: 10})).not.toThrowError()
        expect(() => validate({value: 1})).not.toThrowError()
      })

      it('should validate finite', () => {
        const validate = validations.number.finite[0]
        expect(() => validate({value: NaN})).toThrowError()
        expect(() => validate({value: 11.1})).not.toThrowError()
        expect(() => validate({value: 10})).not.toThrowError()
        expect(() => validate({value: 1})).not.toThrowError()
      })
    })
  })
})
