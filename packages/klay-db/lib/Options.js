const assert = require('assert')
const _ = require('lodash')
const uuid = require('uuid')

function Options(spec) {
  if (spec instanceof Options) {
    return spec
  } else if (!this || this.constructor !== Options) {
    return new Options(spec)
  } else if (typeof spec === 'undefined') {
    spec = {}
  }

  assert.equal(typeof spec, 'object', 'spec must be an object')
  this.spec = _.cloneDeep(spec)
}

Options.prototype._with = function (spec) {
  return new Options(Object.assign({}, this.spec, spec))
}

Options.prototype.automanage = function (property, event, step, supplyWith) {
  if (arguments.length === 3) {
    supplyWith = step
    step = 'pre-validate'
  }

  const automanaged = this.spec.automanaged || []
  const automanage = {property, event, step, supplyWith}

  validateAutomanaged(automanage)
  return this._with({automanaged: automanaged.concat([automanage])})
}

Options.prototype.constrain = function (properties, type, meta) {
  meta = meta || {}

  const constraints = this.spec.constraints || []
  const constraint = {properties, type, meta}

  validateConstraint(constraint)
  return this._with({constraints: constraints.concat([constraint])})
}

Options.prototype.index = function (properties, direction) {
  if (arguments.length === 2 && typeof direction === 'string' && typeof properties === 'string') {
    properties = [{property: properties, direction}]
  } else if (!_.isArray(properties)) {
    properties = [properties]
  }

  const indexes = this.spec.indexes || []
  const index = validateIndexProperties(properties)
  return this._with({indexes: indexes.concat([index])})
}

Options.prototype.toObject = function () {
  return _.cloneDeep(this.spec)
}

function determineSupplyWith(supplyWith) {
  if (typeof supplyWith === 'function' || _.includes(['autoincrement'], supplyWith)) {
    return supplyWith
  } else if (supplyWith === 'date') {
    return () => new Date()
  } else if (supplyWith === 'isotimestamp') {
    return () => new Date().toISOString()
  } else if (supplyWith === 'uuid') {
    return () => uuid.v4()
  } else {
    assert.fail('invalid automanage supplyWith')
  }
}

function validateAutomanaged(automanage) {
  automanage.supplyWith = determineSupplyWith(automanage.supplyWith)

  return [
    [typeof automanage.property === 'string', 'property'],
    [_.includes(['create', 'update', '*'], automanage.event), 'event'],
    [_.includes(['pre-validate', 'post-validate', 'insert'], automanage.step), 'step'],
  ].forEach(validation => {
    assert.ok(validation[0], `invalid automanage ${validation[1]}`)
  })
}

function validateConstraint(constraint) {
  let properties = constraint.properties
  const allowedTypes = ['primary', 'unique', 'reference', 'immutable', 'custom']
  properties = constraint.properties = _.isArray(properties) ? properties : [properties];

  [
    [_.every(properties, property => typeof property === 'string'), 'properties'],
    [_.includes(allowedTypes, constraint.type), 'type'],
    [typeof constraint.meta === 'object', 'meta'],
  ].forEach(validation => {
    assert.ok(validation[0], `invalid constraint ${validation[1]}`)
  })

  constraint.name = constraint.meta.name || `${constraint.type}:${properties.join(',')}`
}

function validateIndexProperties(properties) {
  assert.ok(_.isArray(properties), 'can only index a list of properties')
  properties = properties.map(property => {
    let def = property

    if (typeof property !== 'object') {
      assert.ok(typeof property === 'string', 'property must be a string')

      let direction = 'asc'
      if (property.indexOf('-') === 0) {
        direction = 'desc'
        property = property.substr(1)
      }

      def = {property, direction}
    }

    assert.ok(typeof def.property === 'string', 'property must be a string')
    assert.ok(def.direction === 'asc' || def.direction === 'desc', 'direction must be asc, desc')

    return def
  })

  return properties
}

module.exports = Options
