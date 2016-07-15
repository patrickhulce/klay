var _ = require('lodash');

function extractErrorMessage(error) {
  if (error.name === 'AssertionError') {
    return error.toErrorObject();
  } else {
    return {path: error.valuePath, message: error.name + ': ' + error.message};
  }
}

function extractErrorsList(error) {
  if (!error) {
    return [];
  } else if (_.isArray(error)) {
    return error;
  } else {
    return [extractErrorMessage(error)];
  }
}

function ValidationResult(value, conforms, errors) {
  if (value instanceof ValidationResult) {
    return value;
  }

  this.value = value;
  this.conforms = typeof conforms === 'undefined' ? true : conforms;
  this.errors = extractErrorsList(errors);
}

ValidationResult.prototype.merge = function (other, name) {
  if (other instanceof ValidationResult) {
    this.value[name] = other.value;
    this.conforms = this.conforms && other.conforms;
    this.errors = this.errors.concat(other.errors);
  } else {
    throw new Error('cannot merge ValidationResult with non-ValidationResult');
  }
};

ValidationResult.coalesce = function (validationResults, base) {
  return validationResults.reduce(function (cumulative, result) {
    return cumulative.merge(result.validation, result.name);
  }, new ValidationResult(base, true));
};

module.exports = ValidationResult;
