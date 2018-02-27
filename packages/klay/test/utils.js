const ValidationResult = require('../dist/validation-result').ValidationResult

module.exports = {
  createValidationResult(value) {
    return new ValidationResult({
      value,
      conforms: true,
      isFinished: false,
      errors: [],
      rootValue: value,
      pathToValue: [],
    })
  },
}
