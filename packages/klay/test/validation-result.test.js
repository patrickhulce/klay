const expect = require('chai').expect
const ValidationResult = require('../lib-ts/validation-result').ValidationResult

describe('lib/validation-result.ts', () => {
  describe('#constructor', () => {
    it('creates successfully', () => {
      const result = new ValidationResult({
        value: undefined,
        rootValue: undefined,
        conforms: true,
        errors: [],
        isFinished: true,
        pathToValue: [],
        extraThatsIgnored: {},
      })

      expect(result).to.eql({
        value: undefined,
        conforms: true,
        errors: [],
        isFinished: true,
        rootValue: undefined,
        pathToValue: [],
      })
    })
  })

  describe('.clone', () => {
    it('deep clones the options', () => {
      const value = {foo: {bar: 1}}
      const resultInput = {
        value,
        rootValue: value,
        conforms: true,
        errors: [],
        isFinished: true,
        pathToValue: [],
        extraThatsIgnored: {},
      }

      const resultA = new ValidationResult(resultInput)
      const resultB = resultA.clone()
      resultA.value.other = 1
      resultB.value.extra = 2
      expect(resultB.value).to.not.have.property('other')
      expect(resultA.value).to.not.have.property('extra')
      expect(value).to.eql({foo: {bar: 1}})
    })
  })
})
