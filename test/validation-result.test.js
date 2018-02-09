const expect = require('chai').expect
const ValidationResult = require('../lib/validation-result').ValidationResult
const ValidationError = require('../lib/errors/validation-error').ValidationError

const defaults = {
  value: undefined,
  rootValue: undefined,
  conforms: true,
  errors: [],
  isFinished: false,
  pathToValue: [],
}

function create(obj) {
  return new ValidationResult(Object.assign({}, defaults, obj))
}

describe('lib/validation-result.ts', () => {
  describe('#constructor', () => {
    it('creates successfully', () => {
      const result = new ValidationResult({
        value: undefined,
        rootValue: undefined,
        conforms: true,
        errors: [],
        isFinished: true,
        pathToValue: [],
        extraThatsIgnored: {},
      })

      expect(result).to.eql({
        value: undefined,
        conforms: true,
        errors: [],
        isFinished: true,
        rootValue: undefined,
        pathToValue: [],
      })
    })
  })

  describe('.setConforms', () => {
    it('sets conforms true', () => {
      const result = create({conforms: false, isFinished: false})
      expect(result.setConforms(true)).to.include({conforms: true, isFinished: false})
    })

    it('sets conforms false', () => {
      const result = create({conforms: false, isFinished: false})
      expect(result.setConforms(false)).to.include({conforms: false, isFinished: true})
    })
  })

  describe('.assert', () => {
    it('should throw validation error', () => {
      const result = create({})
      expect(result.assert(true, 'is fine')).to.equal(result)
      expect(() => result.assert(false, '')).to.throw(ValidationError)
      expect(() => result.assert(false, 'hello')).to.throw('hello')
    })
  })

  describe('.clone', () => {
    it('deep clones the options', () => {
      const value = {foo: {bar: 1}}
      const resultInput = {
        value,
        rootValue: value,
        conforms: true,
        errors: [],
        isFinished: true,
        pathToValue: [],
        extraThatsIgnored: {},
      }

      const resultA = new ValidationResult(resultInput)
      const resultB = resultA.clone()
      resultA.value.other = 1
      resultB.value.extra = 2
      expect(resultB.value).to.not.have.property('other')
      expect(resultA.value).to.not.have.property('extra')
      expect(value).to.eql({foo: {bar: 1}})
    })
  })

  describe('#fromValue', () => {
    it('should create a new validation result', () => {
      const result = ValidationResult.fromValue(1, {x: 1}, ['x'])
      expect(result).to.eql({
        value: 1,
        conforms: true,
        errors: [],
        isFinished: false,
        rootValue: {x: 1},
        pathToValue: ['x'],
      })
    })
  })

  describe('#coalesce', () => {
    it('throws when used on an already finished validationResult', () => {
      const original = create({isFinished: true})
      expect(() => ValidationResult.coalesce(original, [])).to.throw(/cannot coalesce/)
    })

    it('reuses base values from original', () => {
      const original = new ValidationResult({
        value: 1,
        rootValue: {x: 1},
        conforms: true,
        isFinished: false,
        pathToValue: ['x'],
        errors: [],
      })

      const result = ValidationResult.coalesce(original, [])
      expect(result).to.eql({
        value: 1,
        rootValue: {x: 1},
        conforms: true,
        isFinished: false,
        pathToValue: ['x'],
        errors: [],
      })
    })

    it('merges all conforming values', () => {
      const valueA = create({value: 1, conforms: true})
      const valueB = create({value: 2, conforms: true})
      const result = ValidationResult.coalesce(valueA, [valueA, valueB])
      expect(result).to.have.property('value', 1)
      expect(result).to.have.property('conforms', true)
      expect(result).to.have.property('isFinished', false)
      expect(result).to.have.property('errors').with.length(0)
    })

    it('merges mixed conforming values', () => {
      const error = new Error('it was an error!')
      const valueA = create({value: 1, conforms: true})
      const valueB = create().markAsErrored(error)
      const result = ValidationResult.coalesce(valueA, [valueA, valueB])
      expect(result).to.have.property('conforms', false)
      expect(result).to.have.property('isFinished', true)
      expect(result).to.have.property('errors').with.length(1)
      expect(result.errors[0].error).to.eql(error)
    })

    it('concats errors', () => {
      const errorA = {message: 'error A'}
      const errorB = {message: 'error B'}
      const errorC = {message: 'error C'}
      const valueA = create({conforms: false, errors: [errorA]})
      const valueB = create({conforms: false, errors: [errorB]})
      const valueC = create({conforms: false, errors: [errorC]})
      const result = ValidationResult.coalesce(valueA, [valueA, valueB, valueC])
      expect(result).to.have.property('conforms', false)
      expect(result).to.have.property('errors').that.eqls([errorA, errorB, errorC])
    })

    it('merges values into object', () => {
      const rootValue = create({value: {x: null, z: 3}})
      const valueA = create({value: 1, pathToValue: ['x']})
      const valueB = create({value: 2, pathToValue: ['y']})
      const result = ValidationResult.coalesce(rootValue, [valueA, valueB])
      expect(result).to.have.property('value').eql({x: 1, y: 2, z: 3})
    })

    it('merges into value array', () => {
      const rootValue = create({value: []})
      const valueA = create({value: 1, pathToValue: ['0']})
      const valueB = create({value: 2, pathToValue: ['1']})
      const result = ValidationResult.coalesce(rootValue, [valueA, valueB])
      expect(result).to.have.property('value').eql([1, 2])
    })

    it('throws when pathToValue is nonsense for array', () => {
      const rootValue = create({value: []})
      const valueA = create({value: 1, pathToValue: ['x', 'y']})
      const valueB = create({value: 2, pathToValue: ['one']})
      const valueC = create({value: 3, pathToValue: ['1.2']})
      expect(() => ValidationResult.coalesce(rootValue, [valueA])).to.throw()
      expect(() => ValidationResult.coalesce(rootValue, [valueB])).to.throw()
      expect(() => ValidationResult.coalesce(rootValue, [valueC])).to.throw()
    })

    it('throws when pathToValue is nonsense for object', () => {
      const rootValue = create({value: {}})
      const valueA = create({value: 1, pathToValue: ['x', 'y']})
      const valueB = create({value: 2, pathToValue: []})
      expect(() => ValidationResult.coalesce(rootValue, [valueA])).to.throw()
      expect(() => ValidationResult.coalesce(rootValue, [valueB])).to.throw()
    })

    it('throws when pathToValue is nonsense', () => {
      const rootValue = create({value: 1})
      const valueA = create({value: 1, pathToValue: ['x', 'y']})
      const valueB = create({value: 2, pathToValue: ['x']})
      expect(() => ValidationResult.coalesce(rootValue, [valueA])).to.throw()
      expect(() => ValidationResult.coalesce(rootValue, [valueB])).to.throw()
    })
  })
})
