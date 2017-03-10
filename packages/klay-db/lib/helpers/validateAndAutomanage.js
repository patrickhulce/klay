const _ = require('lodash')

function determineIgnoredProperties(automanaged, event) {
  return automanaged
    .filter(item => item.step === 'insert' && (item.event === event || item.event === '*'))
    .map(item => item.property)
}

function modelWithEnforcedIgnoredProperties(model, ignoredPropertyNames) {
  if (!ignoredPropertyNames.length) {
    return model
  }

  const allChildren = model.spec.children.map(item => {
    if (_.includes(ignoredPropertyNames, item.name)) {
      return {name: item.name, model: model.constructor.construct({type: 'undefined'})}
    } else {
      return item
    }
  })

  return model.children(allChildren)
}

function determinePostValidationStatus(results, postvalidatePropertyNames) {
  if (results.conforms) {
    return results
  }

  const remainingErrors = _.reject(results.errors, error => {
    return _.includes(postvalidatePropertyNames, error.path)
  })

  return {
    value: results.value,
    errors: remainingErrors,
    conforms: remainingErrors.length === 0,
  }
}

function setAutomanagedProperties(object, properties, event) {
  properties.forEach(item => {
    if (item.event === event || item.event === '*') {
      _.set(object, item.property, item.supplyWith(object))
    }
  })
}

function throwOrReturn(results, options) {
  if (!results.conforms && options.failLoudly) {
    const error = new Error(results.errors[0].message)
    error.errors = results.errors
    throw error
  } else {
    return results
  }
}

module.exports = function (model, event) {
  const automanaged = _.get(model, 'spec.db.automanaged', [])
  const ignoredPropertyNames = determineIgnoredProperties(automanaged, event)
  const prevalidateProperties = _.filter(automanaged, {step: 'pre-validate'})
  const postvalidateProperties = _.filter(automanaged, {step: 'post-validate'})
  const postvalidatePropertyNames = _.map(postvalidateProperties, 'property')
  model = modelWithEnforcedIgnoredProperties(model, ignoredPropertyNames)

  return function (object, options) {
    object = _.cloneDeep(object)
    options = _.assign({failLoudly: false}, options)

    setAutomanagedProperties(object, prevalidateProperties, event)
    const results = determinePostValidationStatus(model.validate(object), postvalidatePropertyNames)
    if (!results.conforms) {
      return throwOrReturn(results, options)
    }

    setAutomanagedProperties(results.value, postvalidateProperties, event)
    return throwOrReturn(model.validate(results.value), options)
  }
}
