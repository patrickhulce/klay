var _ = require('lodash');

function determineIgnoredProperties(automanaged, event) {
  return automanaged.
    filter(item => item.step === 'insert' && (item.event === event || item.event === '*')).
    map(item => item.property);
}

function determinePostValidationStatus(results, postvalidatePropertyNames) {
  if (results.conforms) {
    return results;
  }

  var remainingErrors = _.reject(results.errors, function (error) {
    return _.includes(postvalidatePropertyNames, error.path);
  });

  return {
    value: results.value,
    errors: remainingErrors,
    conforms: remainingErrors.length === 0,
  };
}

function setAutomanagedProperties(object, properties, event) {
  properties.forEach(function (item) {
    if (item.event === event || item.event === '*') {
      _.set(object, item.property, item.supplyWith(object));
    }
  });
}

function throwOrReturn(results, options) {
  if (!results.conforms && options.failLoudly) {
    var error = new Error(results.errors[0].message);
    error.errors = results.errors;
    throw error;
  } else {
    return results;
  }
}

module.exports = function (model, event) {
  var automanaged = _.get(model, 'spec.db.automanaged', []);
  var ignoredPropertyNames = determineIgnoredProperties(automanaged, event);
  var prevalidateProperties = _.filter(automanaged, {step: 'pre-validate'});
  var postvalidateProperties = _.filter(automanaged, {step: 'post-validate'});
  var postvalidatePropertyNames = _.map(postvalidateProperties, 'property');
  model = model.omit(ignoredPropertyNames);

  return function (object, options) {
    object = _.cloneDeep(object);
    options = _.assign({failLoudly: false}, options);

    setAutomanagedProperties(object, prevalidateProperties, event);
    var results = determinePostValidationStatus(model.validate(object), postvalidatePropertyNames);
    if (!results.conforms) {
      return throwOrReturn(results, options);
    }

    setAutomanagedProperties(results.value, postvalidateProperties, event);
    return throwOrReturn(model.validate(results.value), options);
  };
};
