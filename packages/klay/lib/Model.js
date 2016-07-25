var _ = require('lodash');
var assert = require('./assert');
var validations = require('./validations');
var transformations = require('./transformations');

var ModelError = require('./ModelError');
var ValueRef = require('./ValueRef');
var ValidationError = require('./ValidationError');
var ValidationResult = require('./ValidationResult');

var boolOrTrue = function (value, name) {
  if (typeof value === 'undefined') {
    return true;
  }

  assert.typeof(value, 'boolean', name);
  return value;
};

function Model(spec) {
  if (spec instanceof Model) {
    return spec;
  } else if (typeof spec === 'undefined') {
    spec = {};
  }

  assert.equal(typeof spec, 'object', 'spec must be an object');

  this.spec = {};

  if (spec.type) {
    this.type(spec.type);
  }

  if (spec.format) {
    this.format(spec.format, spec.formatOptions || {});
  }

  var preEval = ['type', 'format', 'formatOptions'];
  var assignments = Object.assign({}, Model.defaults, _.omit(spec, preEval));
  _.forEach(assignments, function (value, name) {
    if (typeof Model.prototype[name] !== 'function') {
      throw new ModelError('unknown property of Model: ' + name);
    }

    Model.prototype[name].call(this, value);
  }.bind(this));

  this._isInitialized = true;
}

Model.prototype._with = function (spec) {
  if (this._isInitialized) {
    return Model.construct(Object.assign({}, this.spec, spec));
  } else {
    Object.assign(this.spec, spec);
    return this;
  }
};

Model.prototype._getPropByType = function (prop, useFormat) {
  var format = this.spec.format || '__none';
  return _.get(Model, [prop, this.spec.type, useFormat ? format : '__default']);
};

Model.prototype._getOrThrow = function (name) {
  var value = this.spec[name];
  assert.notEqual(typeof value, 'undefined', 'isUndefined:' + name);
  return value;
};

Model.prototype.type = function (type) {
  assert.oneOf(type, Model.types, 'type');
  return this._with({type: type});
};

Model.prototype.format = function (format, options) {
  assert.oneOf(format, Model.formats[this.spec.type], 'format');
  return this._with({format: format, formatOptions: options || {}});
};

Model.prototype.required = function (value) {
  return this._with({required: boolOrTrue(value, 'required')});
};

Model.prototype.optional = function (value) {
  return this._with({required: !boolOrTrue(value, 'required')});
};

Model.prototype.nullable = function (value) {
  return this._with({nullable: boolOrTrue(value, 'nullable')});
};

Model.prototype.strict = function (value) {
  assert.oneOf(this.spec.type, ['object', 'conditional'], 'type');
  return this._with({strict: boolOrTrue(value)});
};

Model.prototype.default = function (value) {
  assert.ok(this.spec.type, 'type must be set before setting default');

  var msg = 'type of default must equal type of model';
  if (_.isNil(value)) {
    // do nothing
  } else if (_.includes(['string', 'number', 'boolean', 'object'], this.spec.type)) {
    assert.equal(typeof value, this.spec.type, msg);
  } else if (this.spec.type === 'array') {
    assert.ok(_.isArray(value), msg);
  }

  return this._with({default: value});
};

Model.prototype.parse = function (parse) {
  assert.equal(typeof parse, 'function', 'parse must be a function');
  return this._with({parse: parse});
};

Model.prototype.transform = function (transform) {
  assert.equal(typeof transform, 'function', 'transform must be a function');
  return this._with({transform: transform});
};

Model.prototype.options = function (options) {
  assert.ok(_.isArray(options), 'options must be an array');
  return options.reduce(function (model, option) {
    return model.option(option);
  }, this);
};

Model.prototype.option = function (value, reference, condition) {
  assert.ok(this.spec.type, 'type must be set before setting options');

  var base = this.spec.options || [];
  if (this.spec.type === 'conditional') {
    var item = value;
    if (typeof reference === 'function') {
      item = {model: value, condition: reference};
    } else if (typeof reference !== 'undefined') {
      var valueRef = new ValueRef(reference);

      assert.ok(typeof condition !== 'undefined', 'condition must be provided');
      var conditionFunc = typeof condition === 'function' ?
        condition : actual => _.isEqual(actual, condition);

      item = {model: value, ref: valueRef, condition: conditionFunc};
    } else if (value instanceof Model) {
      item = {model: value};
    }

    assert.equal(typeof item, 'object', 'option must be an object');
    assert.equal(typeof item.model, 'object', 'option.model must be an object');
    item.model = Model.construct(item.model);

    value = item;
  } else if (_.includes(['string', 'number'], this.spec.type)) {
    assert.equal(typeof value, this.spec.type, 'type of option must equal type of model');
  }

  return this._with({options: base.concat([value])});
};

Model.prototype.children = function (children) {
  assert.ok(children, 'children must be set');
  assert.equal(typeof children, 'object', 'children must be an object');
  assert.oneOf(this.spec.type, ['object', 'array'], 'type');

  if (_.isArray(children)) {
    children.forEach(function (item) {
      assert.equal(typeof item.name, 'string', 'item must have a name');
      assert.ok(item.model instanceof Model, 'item must have a model');
    });

    return this._with({children: children});
  } else if (this.spec.type === 'array') {
    return this._with({children: Model.construct(children)});
  } else {
    assert.equal(children instanceof Model, false, 'children cannot be a model');
    var kvToChild = (v, k) => {
      return {name: k, model: Model.construct(v)};
    };

    return this._with({children: _.map(children, kvToChild)});
  }
};

Model.prototype.validations = function (validations) {
  assert.ok(_.isArray(validations), 'validations must be an array');
  return validations.reduce(function (model, validation) {
    return model.validation(validation);
  }, this);
};

Model.prototype.validation = function (validation) {
  if (validation instanceof RegExp) {
    assert.equal(this.spec.type, 'string', 'model must be of type string');
  } else {
    assert.ok(typeof validation === 'function', 'validation must be a regex or function');
  }

  var validations = this.spec.validations || [];
  return this._with({validations: validations.concat([validation])})
};

Model.prototype._getApplicableOptions = function (value, root, path) {
  var options = this._getOrThrow('options');
  var defaultOptions = _.filter(options, opt => !opt.condition);
  var applicableOptions = _.filter(options, opt => {
    if (!opt.condition) {
      return false;
    } else if (opt.ref) {
      var refValues = _.isArray(opt.ref) ?
        opt.ref.map(ref => _.get(root, ref.path)) :
        _.get(root, opt.ref.path);
      return opt.condition.call(this, refValues, value, root, path);
    } else {
      return opt.condition.call(this, value, root, path);
    }
  });

  return applicableOptions.length ? applicableOptions : defaultOptions;
};

Model.prototype._delegateValidation = function (value, root, path) {
  var options = this._getApplicableOptions(value, root, path);

  if (this.spec.strict) {
    assert.ok(options.length, 'no applicable models for strict conditional');
  }

  var results = _.map(options, option => option.model._validate(value, root, path));
  return _.find(results, 'conforms') || ValidationResult.coalesce(results, value);
};

Model.prototype._parse = function (value, root, path) {
  if (this.spec.parse) {
    return this.spec.parse(value, root, path);
  } else {
    return value;
  }
};

Model.prototype._validateDefinedness = function (value) {
  if (value instanceof ValidationResult) {
    return value;
  }

  var defaultValue = this.spec.default;
  var hasDefault = typeof defaultValue !== 'undefined';

  var isUndefined = typeof value === 'undefined';
  var isRequired = Boolean(this.spec.required);
  var isNullable = Boolean(this.spec.nullable);

  if (isRequired && !hasDefault) {
    assert.defined(value);
  }

  if (!isNullable) {
    assert.nonnull(value);
  }

  if (isUndefined && hasDefault) {
    value = defaultValue;
  }

  return _.isNil(value) ?
    new ValidationResult(value, true) :
    value;
};

Model.prototype._transform = function (value, root, path) {
  if (value instanceof ValidationResult) {
    return value;
  }

  var transformations = [
    this.spec.transform,
    this._getPropByType('transformations', true),
    this._getPropByType('transformations'),
  ];

  var transform = _.find(transformations, Boolean) || _.identity;
  var transformed = transform.call(this, value, root, path);

  if (transformed instanceof ValidationResult && transformed.conforms) {
    return transformed.value;
  } else {
    return transformed;
  }
};

Model.prototype._validateValue = function (value, root, path) {
  if (value instanceof ValidationResult) {
    return value;
  }

  var validations = [
    this.spec.validations,
    this._getPropByType('validations', true),
    this._getPropByType('validations'),
  ];

  _(validations).
    filter(Boolean).
    flatten().
    forEach(validate => {
      if (validate instanceof RegExp) {
        assert.typeof(value, 'string');
        assert.match(value, validate);
      } else {
        assert.equal(typeof validate, 'function', 'validation must be a function');
        validate.call(this, value, root, path);
      }
    });
};

Model.prototype._throwIfNotAssertion = function (err, path) {
  if (err.name === 'AssertionError') { return; }

  if (!err.valuePath) {
    err.valuePath = path;
  }

  throw err;
};

Model.prototype._validate = function (value, root, path) {
  try {
    if (!this.spec.type) {
      throw new ModelError('model type must be defined');
    } else if (this.spec.type === 'conditional') {
      return this._delegateValidation(value, root, path);
    }

    value = this._parse(value, root, path);
    value = this._validateDefinedness(value, root, path);
    value = this._transform(value, root, path);
    var validationResult = this._validateValue(value, root, path);
    return new ValidationResult(validationResult || value, true);
  } catch (err) {
    this._throwIfNotAssertion(err, path);

    err.valuePath = path;
    return new ValidationResult(value, false, err);
  }
};

Model.prototype.validate = function (value, loudly) {
  var result = this._validate(value, value);
  if (!result.conforms && loudly) {
    throw new ValidationError(result);
  } else {
    return result;
  }
};

Model.reset = function () {
  Model.construct = function (spec) { return new Model(spec); };
  Model.types = [
    'undefined', 'any',
    'boolean', 'number', 'string',
    'array', 'object', 'conditional',
  ];

  Model.validations = _.cloneDeep(validations);
  Model.transformations = _.cloneDeep(transformations);

  Model.formats = {};
  Model.defaults = {nullable: true};
};

Model.reset();
module.exports = Model;
