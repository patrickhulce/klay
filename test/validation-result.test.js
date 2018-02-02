const expect = require('chai').expect
const ValidationResult = require('../lib-ts/validation-result').ValidationResult

const defaults = {
  value: undefined,
  rootValue: undefined,
  conforms: true,
  errors: [],
  isFinished: false,
  pathToValue: [],
}

function create(obj) {
  return Object.assign({}, defaults, obj)
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
      const result = new ValidationResult(create({conforms: false, isFinished: false}))
      expect(result.setConforms(true)).to.include({conforms: true, isFinished: false})
    })

    it('sets conforms false', () => {
      const result = new ValidationResult(create({conforms: false, isFinished: false}))
      expect(result.setConforms(false)).to.include({conforms: false, isFinished: true})
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

  describe('#coalesce', () => {
    it('throws when used on an already finished validationResult', () => {
      const original = new ValidationResult(create({isFinished: true}))
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
      const valueA = new ValidationResult(create({value: 1, conforms: true}))
      const valueB = new ValidationResult(create({value: 2, conforms: true}))
      const result = ValidationResult.coalesce(valueA, [valueA, valueB])
      expect(result).to.have.property('value', 1)
      expect(result).to.have.property('conforms', true)
      expect(result).to.have.property('isFinished', false)
      expect(result).to.have.property('errors').with.length(0)
    })

    it('merges mixed conforming values', () => {
      const error = new Error('it was an error!')
      const valueA = new ValidationResult(create({value: 1, conforms: true}))
      const valueB = new ValidationResult(create()).markAsErrored(error)
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
      const valueA = new ValidationResult(create({conforms: false, errors: [errorA]}))
      const valueB = new ValidationResult(create({conforms: false, errors: [errorB]}))
      const valueC = new ValidationResult(create({conforms: false, errors: [errorC]}))
      const result = ValidationResult.coalesce(valueA, [valueA, valueB, valueC])
      expect(result).to.have.property('conforms', false)
      expect(result).to.have.property('errors').that.eqls([errorA, errorB, errorC])
    })
  })
})
