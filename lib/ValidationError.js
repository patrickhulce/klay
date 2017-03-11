const _ = require('lodash')

function ValidationError(validationResult) {
  Error.captureStackTrace(this)
  this.name = 'KlayValidationError'
  this.message = _.get(validationResult, 'errors.0.message')
  this.errors = validationResult.errors
}

ValidationError.prototype = _.create(Error.prototype, {constructor: ValidationError})

module.exports = ValidationError
