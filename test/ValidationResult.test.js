const should = require('chai').should()

const ValidationResult = relativeRequire('ValidationResult.js')

describe('ValidationResult.js', () => {
  describe('#constructor', () => {
    it('should accept a value', () => {
      const result = new ValidationResult(true)
      result.should.be.ok
    })
  })

  describe('#asError', () => {
    it('should return ValidationError', () => {
      const result = new ValidationResult('string', false, {
        valuePath: 'my.property',
        message: 'was bad',
        name: 'CustomError',
      })
      const err = result.asError()
      err.should.have.property('message').contains('was bad')
      err.should.have.property('validationResult', result)
    })

    it('should return null when conforms', () => {
      const result = new ValidationResult(true)
      should.not.exist(result.asError())
    })
  })
})
