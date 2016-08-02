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
  if (!(other instanceof ValidationResult)) {
    other = new ValidationResult(other);
  }

  var value = _.clone(this.value);
  if (typeof name === 'string' || typeof name === 'number') {
    value = _.set(value, name, other.value);
  } else if (_.isArray(value) && _.isArray(other.value)) {
    value = this.value.concat(other.value);
  } else if (typeof value === 'object' && typeof other.value === 'object') {
    value = _.assign({}, value, other.value);
  } else {
    value = value || other.value;
  }

  return new ValidationResult(
    value,
    this.conforms && other.conforms,
    this.errors.concat(other.errors)
  );
};

ValidationResult.coalesce = function (validationResults, base) {
  return validationResults.reduce(function (cumulative, result) {
    return result instanceof ValidationResult ?
      cumulative.merge(result) :
      cumulative.merge(result.validation, result.name);
  }, new ValidationResult(base, true));
};

module.exports = ValidationResult;
