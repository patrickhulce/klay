const _ = require('lodash')
const assert = require('./assert')
const validations = require('./validations')
const transformations = require('./transformations')

const ModelError = require('./ModelError')
const ValueRef = require('./ValueRef')
const ValidationError = require('./ValidationError')
const ValidationResult = require('./ValidationResult')

function boolOrTrue(value, name) {
  if (typeof value === 'undefined') {
    return true
  }

  assert.typeof(value, 'boolean', name)
  return value
}

function kvToChild(v, k) {
  try {
    return {name: k, model: Model.construct(v)}
  } catch (err) {
    throw new Error(`failed to create child model for property "${k}": ${err.message}`)
  }
}

function Model(spec) {
  if (spec && spec.__isKlayModel) {
    return spec
  } else if (typeof spec === 'undefined') {
    spec = {}
  } else {
    spec = _.cloneDeep(spec)
  }

  assert.equal(typeof spec, 'object', 'spec must be an object')

  this.spec = {}
  this.__isKlayModel = true

  if (spec.type) {
    this.type(spec.type)
  }

  if (spec.format) {
    this.format(spec.format, spec.formatOptions || {})
  }

  const preEval = ['type', 'format', 'formatOptions']
  const assignments = Object.assign({}, Model.defaults, _.omit(spec, preEval))
  _.forEach(assignments, (value, name) => {
    if (_.hasIn(this, name)) {
      this[name](value)
    } else {
      this.spec[name] = value
    }
  })

  this._isInitialized = true
  this._callHooks('constructor')
}

Model.prototype._callHooks = function (name) {
  const model = this
  const hooks = Model.hooks[name]

  if (hooks) {
    hooks.forEach(hook => {
      assert.equal(typeof hook, 'function', 'hook must be a function')
      hook.call(model)
    })
  }

  return this
}

Model.prototype._with = function (spec) {
  if (this._isInitialized) {
    return Model.construct(Object.assign({}, this.spec, spec))
  } else {
    Object.assign(this.spec, spec)
    return this
  }
}

Model.prototype._getPropByType = function (prop, useFormat) {
  const format = this.spec.format || '__none'
  return _.get(Model, [prop, this.spec.type, useFormat ? format : '__default'])
}

Model.prototype._getOrThrow = function (name) {
  const value = this.spec[name]
  assert.notEqual(typeof value, 'undefined', 'isUndefined:' + name)
  return value
}

Model.prototype.type = function (type) {
  assert.oneOf(type, Model.types, 'type')
  return this._with({type})
}

Model.prototype.format = function (format, options) {
  assert.oneOf(format, Model.formats[this.spec.type], 'format')
  return this._with({format, formatOptions: options || {}})
}

Model.prototype.required = function (value) {
  return this._with({required: boolOrTrue(value, 'required')})
}

Model.prototype.optional = function (value) {
  return this._with({required: !boolOrTrue(value, 'required')})
}

Model.prototype.nullable = function (value) {
  return this._with({nullable: boolOrTrue(value, 'nullable')})
}

Model.prototype.strict = function (value) {
  return this._with({strict: boolOrTrue(value)})
}

Model.prototype.default = function (value) {
  assert.ok(this.spec.type, 'type must be set before setting default')

  const msg = 'type of default must equal type of model'
  if (_.isNil(value)) {
    // do nothing
  } else if (_.includes(['string', 'number', 'boolean', 'object'], this.spec.type)) {
    assert.equal(typeof value, this.spec.type, msg)
  } else if (this.spec.type === 'array') {
    assert.ok(_.isArray(value), msg)
  }

  return this._with({default: value})
}

Model.prototype.parse = function (parse) {
  assert.equal(typeof parse, 'function', 'parse must be a function')
  return this._with({parse})
}

Model.prototype.transform = function (transform) {
  assert.equal(typeof transform, 'function', 'transform must be a function')
  return this._with({transform})
}

Model.prototype.options = function (options) {
  assert.ok(_.isArray(options), 'options must be an array')
  return options.reduce((model, option) => {
    return model.option(option)
  }, this)
}

Model.prototype.option = function (value, reference, condition) {
  assert.ok(this.spec.type, 'type must be set before setting options')

  const base = this.spec.options || []
  if (this.spec.type === 'conditional') {
    let item = value
    if (typeof reference === 'function') {
      item = {model: value, condition: reference}
    } else if (typeof reference !== 'undefined') {
      const valueRef = new ValueRef(reference)

      assert.ok(typeof condition !== 'undefined', 'condition must be provided')
      const conditionFunc = typeof condition === 'function' ?
        condition : actual => _.isEqual(actual, condition)

      item = {model: value, ref: valueRef, condition: conditionFunc}
    } else if (value.__isKlayModel) {
      item = {model: value}
    }

    assert.equal(typeof item, 'object', 'option must be an object')
    assert.equal(typeof item.model, 'object', 'option.model must be an object')
    item.model = Model.construct(item.model)

    value = item
  } else if (_.includes(['string', 'number'], this.spec.type)) {
    assert.equal(typeof value, this.spec.type, 'type of option must equal type of model')
  }

  return this._with({options: base.concat([value])})
}

Model.prototype.children = function (children) {
  assert.ok(children, 'children must be set')
  assert.equal(typeof children, 'object', 'children must be an object')
  assert.oneOf(this.spec.type, ['object', 'array'], 'type')

  if (_.isArray(children)) {
    children.forEach(item => {
      assert.equal(typeof item.name, 'string', 'item must have a name')
      assert.ok(item.model.__isKlayModel, 'item must have a model')
    })

    return this._with({children})._callHooks('children')
  } else if (this.spec.type === 'array') {
    return this._with({children: Model.construct(children)})._callHooks('children')
  } else {
    assert.ok(!children.__isKlayModel, 'children cannot be a model')
    return this._with({children: _.map(children, kvToChild)})._callHooks('children')
  }
}

Model.prototype.pick = function (fields) {
  const matched = _.filter(this.spec.children || [], item => _.includes(fields, item.name))
  return this.children(matched)
}

Model.prototype.omit = function (fields) {
  const matched = _.reject(this.spec.children || [], item => _.includes(fields, item.name))
  return this.children(matched)
}

Model.prototype.merge = function (other) {
  assert.ok(other.__isKlayModel, 'can only merge with another model')
  const matched = (this.spec.children || []).concat(other.spec.children || [])
  const uniq = _(matched).map('name').uniq().value()

  assert.equal(matched.length, uniq.length, 'cannot merge conflicting models')
  return this.children(matched)
}

Model.prototype.validations = function (validations) {
  assert.ok(_.isArray(validations), 'validations must be an array')
  return validations.reduce((model, validation) => {
    return model.validation(validation)
  }, this)
}

Model.prototype.validation = function (validation) {
  if (validation instanceof RegExp) {
    assert.equal(this.spec.type, 'string', 'model must be of type string')
  } else {
    assert.ok(typeof validation === 'function', 'validation must be a regex or function')
  }

  const validations = this.spec.validations || []
  return this._with({validations: validations.concat([validation])})
}

Model.prototype._getApplicableOptions = function (value, root, path) {
  const options = this._getOrThrow('options')
  const defaultOptions = _.filter(options, opt => !opt.condition)
  const applicableOptions = _.filter(options, opt => {
    if (!opt.condition) {
      return false
    } else if (opt.ref) {
      const refValues = _.isArray(opt.ref) ?
        opt.ref.map(ref => _.get(root, ref.path)) :
        _.get(root, opt.ref.path)
      return opt.condition.call(this, refValues, value, root, path)
    } else {
      return opt.condition.call(this, value, root, path)
    }
  })

  return applicableOptions.length ? applicableOptions : defaultOptions
}

Model.prototype._delegateValidation = function (value, root, path) {
  const options = this._getApplicableOptions(value, root, path)

  if (this.spec.strict) {
    assert.ok(options.length, 'no applicable models for strict conditional')
  }

  const results = _.map(options, option => option.model._validate(value, root, path))
  return _.find(results, 'conforms') || ValidationResult.coalesce(results, value)
}

Model.prototype._parse = function (value, root, path) {
  if (this.spec.parse) {
    return this.spec.parse(value, root, path)
  } else {
    return value
  }
}

Model.prototype._validateDefinedness = function (value) {
  if (value instanceof ValidationResult) {
    return value
  }

  const defaultValue = this.spec.default
  const hasDefault = typeof defaultValue !== 'undefined'

  const isUndefined = typeof value === 'undefined'
  const isRequired = Boolean(this.spec.required)
  const isNullable = Boolean(this.spec.nullable)

  if (isRequired && !hasDefault) {
    assert.defined(value)
  }

  if (!isNullable) {
    assert.nonnull(value)
  }

  if (isUndefined && hasDefault) {
    value = defaultValue
  }

  return _.isNil(value) ?
    new ValidationResult(value, true) :
    value
}

Model.prototype._transform = function (value, root, path) {
  if (value instanceof ValidationResult) {
    return value
  }

  const transformations = [
    this.spec.transform,
    this._getPropByType('transformations', true),
    this._getPropByType('transformations'),
  ]

  const transform = _.find(transformations, Boolean) || _.identity
  const transformed = transform.call(this, value, root, path)

  if (transformed instanceof ValidationResult && transformed.conforms) {
    return transformed.value
  } else {
    return transformed
  }
}

Model.prototype._validateValue = function (value, root, path) {
  if (value instanceof ValidationResult) {
    return value
  }

  const validations = [
    this.spec.validations,
    this._getPropByType('validations', true),
    this._getPropByType('validations'),
  ]

  _(validations).
    filter(Boolean).
    flatten().
    forEach(validate => {
      if (validate instanceof RegExp) {
        assert.typeof(value, 'string')
        assert.match(value, validate)
      } else {
        assert.equal(typeof validate, 'function', 'validation must be a function')
        validate.call(this, value, root, path)
      }
    })
}

Model.prototype._throwIfNotAssertion = function (err, path) {
  if (err.name === 'AssertionError') { return }

  if (!err.valuePath) {
    err.valuePath = path
  }

  throw err
}

Model.prototype._validate = function (value, root, path) {
  try {
    if (!this.spec.type) {
      throw new ModelError('model type must be defined')
    } else if (this.spec.type === 'conditional') {
      return this._delegateValidation(value, root, path)
    }

    value = this._parse(value, root, path)
    value = this._validateDefinedness(value, root, path)
    value = this._transform(value, root, path)
    const validationResult = this._validateValue(value, root, path)
    return new ValidationResult(validationResult || value, true)
  } catch (err) {
    this._throwIfNotAssertion(err, path)

    err.valuePath = path
    return new ValidationResult(value, false, err)
  }
}

Model.prototype.validate = function (value, loudly) {
  const result = this._validate(value, value)
  if (!result.conforms && loudly) {
    throw new ValidationError(result)
  } else {
    return result
  }
}

Model.reset = function () {
  Model.construct = function (spec) { return new Model(spec) }
  Model.types = [
    'undefined', 'any',
    'boolean', 'number', 'string',
    'array', 'object', 'conditional',
  ]

  Model.validations = _.cloneDeep(validations)
  Model.transformations = _.cloneDeep(transformations)

  Model.hooks = {constructor: undefined}
  Model.formats = {}
  Model.defaults = {nullable: true}
}

Model.reset()
module.exports = Model
