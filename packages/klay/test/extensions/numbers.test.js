/* eslint-disable max-nested-callbacks */
const expect = require('chai').expect
const extension = require('../../lib/extensions/numbers')

const validations = extension.validations

describe('lib/extensions/numbers.ts', () => {
  describe('validations', () => {
    describe('number', () => {
      it('should validate integers', () => {
        const validate = validations.number.integer[0]
        expect(() => validate({value: NaN})).to.throw()
        expect(() => validate({value: 11.1})).to.throw()
        expect(() => validate({value: 10})).to.not.throw()
        expect(() => validate({value: 1})).to.not.throw()
      })

      it('should validate finite', () => {
        const validate = validations.number.finite[0]
        expect(() => validate({value: NaN})).to.throw()
        expect(() => validate({value: 11.1})).to.not.throw()
        expect(() => validate({value: 10})).to.not.throw()
        expect(() => validate({value: 1})).to.not.throw()
      })
    })
  })
})
