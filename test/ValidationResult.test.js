var should = require('chai').should();
var ValidationResult = relativeRequire('ValidationResult.js');

describe('ValidationResult.js', function () {
  describe('#constructor', function () {
    it('should accept a value', function () {
      const result = new ValidationResult(true);
      result.should.be.ok
    });
  });

  describe('#asError', function () {
    it('should return ValidationError', function () {
      const result = new ValidationResult('string', false, {
        valuePath: 'my.property',
        message: 'was bad',
        name: 'CustomError',
      });
      const err = result.asError();
      err.should.have.property('message').contains('was bad');
      err.should.have.property('validationResult', result);
    });

    it('should return null when conforms', function () {
      const result = new ValidationResult(true);
      should.not.exist(result.asError());
    });
  });
});
