var assert = require('assert');
var _ = require('lodash');

function Options(spec) {
  if (spec instanceof Options) {
    return spec;
  } else if (!this || this.constructor !== Options) {
    return new Options(spec);
  } else if (typeof spec === 'undefined') {
    spec = {};
  }

  assert.equal(typeof spec, 'object', 'spec must be an object');
  this.spec = _.cloneDeep(spec);
}

Options.prototype._with = function (spec) {
  return new Options(Object.assign({}, this.spec, spec));
};

Options.prototype.automanage = function (property, event, lifecycle, supplyWith) {
  if (arguments.length === 3) {
    supplyWith = lifecycle;
    lifecycle = 'pre-validate';
  }

  var automanaged = this.spec.automanaged || [];
  var automanage = {property, on: event, lifecycle, supplyWith};

  validateAutomanaged(automanage);
  return this._with({automanaged: automanaged.concat([automanage])});
};

Options.prototype.constrain = function (properties, type, meta) {
  meta = meta || {};

  var constraints = this.spec.constraints || [];
  var constraint = {properties, type, meta};

  validateConstraint(constraint);
  return this._with({constraints: constraints.concat([constraint])});
};

Options.prototype.index = function (properties, direction) {
  if (arguments.length === 2 && typeof direction === 'string' && typeof properties === 'string') {
    properties = [{property: properties, direction}];
  } else if (!_.isArray(properties)) {
    properties = [properties];
  }

  var indexes = this.spec.indexes || [];
  var index = validateIndexProperties(properties);
  return this._with({indexes: indexes.concat([index])});
};

Options.prototype.toObject = function () {
  return _.cloneDeep(this.spec);
};

function validateAutomanaged(automanage) {
  return [
    [typeof automanage.property === 'string', 'property'],
    [_.includes(['create', 'update'], automanage.on), 'event'],
    [_.includes(['pre-validate', 'post-validate'], automanage.lifecycle), 'lifecycle'],
    [typeof automanage.supplyWith === 'function', 'supplyWith'],
  ].forEach(function (validation) {
    assert.ok(validation[0], `invalid automanage ${validation[1]}`);
  });
}

function validateConstraint(constraint) {
  var properties = constraint.properties;
  var allowedTypes = ['primary', 'unique', 'reference', 'immutable', 'custom'];
  properties = constraint.properties = _.isArray(properties) ? properties : [properties];

  [
    [_.every(properties, property => typeof property === 'string'), 'properties'],
    [_.includes(allowedTypes, constraint.type), 'type'],
    [typeof constraint.meta === 'object', 'meta'],
  ].forEach(function (validation) {
    assert.ok(validation[0], `invalid constraint ${validation[1]}`);
  });

  constraint.name = constraint.meta.name || `${constraint.type}:${properties.join(',')}`;
}

function validateIndexProperties(properties) {
  assert.ok(_.isArray(properties), 'can only index a list of properties');
  properties = properties.map(function (property) {
    var def = property;

    if (typeof property !== 'object') {
      assert.ok(typeof property === 'string', 'property must be a string');

      var direction = 'asc';
      if (property.indexOf('-') === 0) {
        direction = 'desc';
        property = property.substr(1);
      }

      def = {property, direction};
    }

    assert.ok(typeof def.property === 'string', 'property must be a string');
    assert.ok(def.direction === 'asc' || def.direction === 'desc', 'direction must be asc, desc');

    return def;
  });

  return properties;
}

module.exports = Options;
