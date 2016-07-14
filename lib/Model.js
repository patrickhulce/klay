var _ = require('lodash');
var assert = require('./assert');
var validations = require('./validations');
var transformations = require('./transformations');

var ModelError = require('./ModelError');
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

  if (spec.type) { this.type(spec.type); }
  var assignments = Object.assign({}, Model.defaults, spec);
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

Model.prototype._getOrThrow = function (name) {
  var value = this.spec[name];
  assert.notEqual(typeof value, 'undefined', 'isUndefined:' + name);
  return value;
};

Model.prototype.type = function (type) {
  assert.oneOf(type, Model.types, 'type');
  return this._with({type: type});
};

Model.prototype.format = function (format) {
  assert.oneOf(format, Model.formats[this.spec.type], 'format');
  return this._with({format: format});
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
  assert.equal(this.spec.type, 'object', 'strict only applies to object Models');
  return this._with({strict: boolOrTrue(value)});
};

Model.prototype.default = function (value) {
  assert.ok(this.spec.type, 'type must be set before setting default');

  var msg = 'type of default must equal type of model';
  if (typeof value === 'undefined') {
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

Model.prototype.option = function (value, condition) {
  assert.ok(this.spec.type, 'type must be set before setting options');

  var base = this.spec.options || [];
  if (this.spec.type === 'conditional') {
    var item = value;
    if (typeof condition !== 'undefined') {
      assert.equal(typeof condition, 'function', 'condition must be a function');
      item = {model: value, condition: condition};
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
  assert.ok(_.includes(['object', 'array'], this.spec.type), 'children can only be set on object or array');

  if (this.spec.type === 'array') {
    return this._with({children: Model.construct(children)});
  } else {
    return this._with({children: _.mapValues(children, v => Model.construct(v))});
  }
};

Model.prototype.validations = function (validations) {
  var msg = 'validations must be a regex, function, or array of functions';
  if (_.isArray(validations)) {
    validations.forEach(item => assert.ok(typeof item === 'function', msg));
  } else {
    assert.ok(validations instanceof RegExp || typeof validations === 'function', msg);
  }

  return this._with({validations: validations});
};

Model.prototype._validateDefinedness = function (value) {
  var defaultValue = this.spec.default;
  var hasDefault = typeof defaultValue !== 'undefined';

  var isNull = value === null;
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
    return defaultValue;
  } else if (isUndefined || isNull) {
    return new ValidationResult(value, true);
  } else {
    return value;
  }
};

Model.prototype._transform = function (value, root, path) {
  var transformations = [
    this.spec.transform,
    _.get(Model, ['transformations', this.spec.type, this.spec.format || '__none']),
    _.get(Model, ['transformations', this.spec.type, '__default']),
  ];

  var transform = _.find(transformations, Boolean) || _.identity;
  var transformed = transform(value, root, path);

  if (transformed instanceof ValidationResult && transformed.conforms) {
    return transformed.value;
  } else {
    return transformed;
  }
};

Model.prototype._validateValue = function (value) {
  var validations = [
    this.spec.validations,
    _.get(Model, ['validations', this.spec.type, this.spec.format || '__none']),
    _.get(Model, ['validations', this.spec.type, '__default']),
  ];

  var validate = _.find(validations, Boolean) || _.noop;
  if (validate instanceof RegExp) {
    var regexp = validate;
    validate = function (value) {
      assert.equal(typeof value, 'string', 'typeof');
      assert.ok(value.match(regexp), 'pattern');
    };
  } else if (_.isArray(validate)) {
    var validateFuncs = validate;
    validate = function (value) {
      _.forEach(validateFuncs, validateFunc => validateFunc.call(this, value));
    };
  }

  return validate.call(this, value);
};

Model.prototype._validate = function (value, root, path) {
  try {
    if (!this.spec.type) {
      throw new ModelError('model type must be defined');
    }

    if (this.spec.parse) {
      value = this.spec.parse(value, root, path);
    }

    if (value instanceof ValidationResult) {
      return value;
    }

    value = this._validateDefinedness(value, path);
    if (value instanceof ValidationResult) {
      return value;
    }

    value = this._transform(value, root, path);
    if (value instanceof ValidationResult) {
      return value;
    }

    var validationResult = this._validateValue(value, path);
    if (validationResult instanceof ValidationResult) {
      return validationResult;
    } else {
      return new ValidationResult(value, true);
    }
  } catch (err) {
    if (err.name !== 'AssertionError') {
      if (!err.valuePath) {
        err.valuePath = path;
      }

      throw err;
    }

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
  Model.types = ['boolean', 'number', 'string', 'array', 'object', 'conditional', 'undefined'];
  Model.validations = _.cloneDeep(validations);
  Model.transformations = _.cloneDeep(transformations);

  Model.formats = {};
  Model.defaults = {nullable: true};
};

Model.reset();
module.exports = Model;
