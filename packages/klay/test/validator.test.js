/* eslint-disable no-undef, space-before-function-paren, no-extra-semi */
const _ = require('lodash')
const expect = require('chai').expect
const Model = require('../lib-ts/model').Model
const Validator = require('../lib-ts/validator').Validator
const assert = require('../lib-ts/errors/validation-error').assertions

describe('lib/validator.ts', () => {
  const defaultOptions = {
    types: ['number', 'string', 'object'],
    validations: {
      number: {___ALL_FORMATS___: v => assert.typeof(v.value, 'number')},
      string: {___ALL_FORMATS___: v => assert.typeof(v.value, 'string')},
      object: {___ALL_FORMATS___: v => assert.typeof(v.value, 'object')},
    },
  }

  describe('.validate', () => {
    let model, validatorOptions

    beforeEach(() => {
      model = new Model({}, defaultOptions)
      validatorOptions = defaultOptions
    })

    const validate = (value, opts) => {
      return new Validator(model, validatorOptions).validate(value, opts)
    }

    it('should work with no type', () => {
      expect(validate({})).to.eql({
        conforms: true,
        value: {},
        errors: [],
      })
    })

    it('should fail loudly when told to', () => {
      model = model.type('number')
      expect(() => validate('not a number', {failLoudly: true})).to.throw(/expected.*number/)
    })

    context('required', () => {
      it('should conform when present', () => {
        model = model.type('object').required()
        expect(validate({})).to.eql({
          conforms: true,
          value: {},
          errors: [],
        })
      })

      it('should conform when present', () => {
        model = model
          .type('object')
          .required()
          .nullable()
        expect(validate(null)).to.eql({
          conforms: true,
          value: null,
          errors: [],
        })
      })

      it('should not conform when absent', () => {
        model = model.type('object').required()
        expect(validate(undefined)).to.eql({
          conforms: false,
          value: undefined,
          errors: [{message: 'expected value to be defined', actual: undefined}],
        })
      })
    })

    context('nullable', () => {
      it('should not conform when null', () => {
        model = model.type('string').nullable(false)
        expect(validate(null)).to.eql({
          conforms: false,
          value: null,
          errors: [{message: 'expected value to be non-null', actual: null}],
        })
      })

      it('should conform even when required', () => {
        model = model
          .type('object')
          .required()
          .nullable()
        expect(validate(null)).to.eql({
          conforms: true,
          value: null,
          errors: [],
        })
      })
    })

    context('default', () => {
      it('should fill in when undefined', () => {
        model = model.type('string').default('Hello, World')
        expect(validate(undefined, {failLoudly: true})).to.eql({
          conforms: true,
          value: 'Hello, World',
          errors: [],
        })
      })

      it('should not fill in when undefined and value is required', () => {
        model = model
          .type('number')
          .default(123)
          .required()
        expect(validate(undefined)).to.eql({
          conforms: false,
          value: undefined,
          errors: [{message: 'expected value to be defined', actual: undefined}],
        })
      })

      it('should not fill in when null', () => {
        model = model
          .type('number')
          .nullable()
          .default(1)
        expect(validate(null)).to.eql({
          conforms: true,
          value: null,
          errors: [],
        })
      })

      it('should still enforce non-null', () => {
        model = model.type('number').default(null)
        expect(validate(undefined)).to.eql({
          conforms: false,
          value: null,
          errors: [{message: 'expected value to be non-null', actual: null}],
        })
      })

      it('should still validate', () => {
        model = model
          .type('string')
          .default('Hello, World')
          .validations(/skrilla/)
        expect(validate(undefined)).to.eql({
          conforms: false,
          value: 'Hello, World',
          errors: [
            {
              message: 'expected value (Hello, World) to match /skrilla/',
              actual: 'Hello, World',
              expected: /skrilla/,
            },
          ],
        })
      })

      it('should still validate except when null', () => {
        model = model
          .type('string')
          .nullable()
          .default(null)
          .validations(/skrilla/)

        expect(validate(null)).to.eql({
          conforms: true,
          value: null,
          errors: [],
        })
      })
    })

    context('enum', () => {
      it('should support simple types', () => {
        model = model.type('string').enum(['hello', 'bar'])
        expect(validate('hello')).to.have.property('conforms', true)
        expect(validate('bar')).to.have.property('conforms', true)
        expect(validate('other')).to.have.property('conforms', false)
        expect(validate(2)).to.have.property('conforms', false)
      })

      it('should provide useful errors when simple', () => {
        model = model.type('string').enum(['hello', 'bar'])
        const validation = validate('other')
        expect(validation).to.have.property('conforms', false)
        expect(validation).to.have.property('value', 'other')
        expect(validation).to.have.nested.property('errors.0.expected').eql(['hello', 'bar'])
      })

      it('should support complex types', () => {
        const optionA = new Model({}, defaultOptions).type('string')
        const optionB = new Model({}, defaultOptions).type('object')
        model = model.enum([optionA, optionB])
        expect(validate(true)).to.have.property('conforms', false)
        expect(validate(1)).to.have.property('conforms', false)
        expect(validate({})).to.have.property('conforms', true)
        expect(validate('hello')).to.have.property('conforms', true)
      })

      it('should provide useful errors when complex', () => {
        const optionA = new Model({}, defaultOptions).type('string')
        const optionB = new Model({}, defaultOptions).type('object')
        model = model.enum([optionA, optionB])
        const validation = validate(1)
        expect(validation).to.have.property('conforms', false)
        expect(validation).to.have.property('value', 1)
        expect(validation).to.have.property('errors').with.length(1)

        const error = validation.errors[0]
        expect(error).to.have.property('message').match(/match.*enum/)
        expect(error).to.have.property('details').with.length(2)
        expect(error.details[0]).to.have.property('expected', 'string')
        expect(error.details[1]).to.have.property('expected', 'object')
      })
    })

    context('coerce', () => {
      it('should use coerce before checking definedness', () => {
        const parser = val => val.setValue('something')
        model = model
          .type('string')
          .required()
          .coerce(parser)

        expect(validate(null)).to.eql({
          conforms: true,
          value: 'something',
          errors: [],
        })
      })

      it('should still check definedness', () => {
        const parser = val => val.setValue(undefined)
        model = model
          .type('string')
          .required()
          .coerce(parser)

        expect(validate(null)).to.eql({
          conforms: false,
          value: undefined,
          errors: [{message: 'expected value to be defined', actual: undefined}],
        })
      })

      it('should short-circuit', () => {
        const parser = val => val.setValue('something').setIsFinished(true)
        model = model
          .type('string')
          .required()
          .coerce(parser)
          .validations(/skrilla/)

        expect(validate(null)).to.eql({
          conforms: true,
          value: 'something',
          errors: [],
        })
      })

      it('should use the correct phase', () => {
        const parser = val => val.setValue('something')
        model = model
          .type('string')
          .required()
          .coerce(parser, 'validate-value')
          .validations(/skrilla/)

        expect(validate('skrilla')).to.eql({
          conforms: true,
          value: 'something',
          errors: [],
        })
      })

      it('should throw when parser returns bad value', () => {
        const parser = () => 'something'
        model = model
          .type('string')
          .required()
          .coerce(parser)

        expect(() => validate('Hello, World')).to.throw(/must return.*ValidationResult/)
      })
    })

    context('validations [RegExp]', () => {
      it('should pass a valid match', () => {
        model = model
          .type('string')
          .required()
          .validations(/^foo.*bar$/)

        expect(validate('foo Anything Goes bar')).to.eql({
          conforms: true,
          value: 'foo Anything Goes bar',
          errors: [],
        })
      })

      it('should fail an invalid match', () => {
        model = model
          .type('string')
          .required()
          .validations(/^foo.*bar$/)

        expect(validate('Anything Goes bar')).to.eql({
          conforms: false,
          value: 'Anything Goes bar',
          errors: [
            {
              message: 'expected value (Anything Goes bar) to match /^foo.*bar$/',
              actual: 'Anything Goes bar',
              expected: /^foo.*bar$/,
            },
          ],
        })
      })

      it('should fail a non-string', () => {
        model = model.type('object').validations(/^foo.*bar$/)

        expect(validate({})).to.eql({
          conforms: false,
          value: {},
          errors: [
            {
              message: 'expected value ({}) to have typeof string',
              actual: 'object',
              expected: 'string',
            },
          ],
        })
      })
    })

    context('validations [function]', () => {
      it('should pass a valid match', () => {
        model = model
          .type('string')
          .required()
          .validations(_.noop)

        expect(validate('Hello, World')).to.eql({
          conforms: true,
          value: 'Hello, World',
          errors: [],
        })
      })

      it('should pass a valid array match', () => {
        model = model
          .type('string')
          .required()
          .validations([_.noop, _.noop])

        expect(validate('Hello, World')).to.eql({
          conforms: true,
          value: 'Hello, World',
          errors: [],
        })
      })

      it('should pass a valid, mixed array match', () => {
        model = model
          .type('string')
          .required()
          .validations([_.noop, _.noop, /World/])

        expect(validate('Hello, World')).to.eql({
          conforms: true,
          value: 'Hello, World',
          errors: [],
        })
      })

      it('should fail when one regex fails', () => {
        model = model
          .type('string')
          .required()
          .validations([_.noop, /missing/, _.noop])

        expect(validate('Hello, World')).to.eql({
          conforms: false,
          value: 'Hello, World',
          errors: [
            {
              message: 'expected value (Hello, World) to match /missing/',
              actual: 'Hello, World',
              expected: /missing/,
            },
          ],
        })
      })

      it('should fail when one function fails', () => {
        const fail = () => assert.ok(false, 'invalid value')
        model = model
          .type('string')
          .required()
          .validations([_.noop, fail, _.noop])

        expect(validate('Hello, World')).to.eql({
          conforms: false,
          value: 'Hello, World',
          errors: [{message: 'invalid value'}],
        })
      })
    })

    context('validator-options', () => {
      context('validations', () => {
        beforeEach(() => {
          validatorOptions = {
            types: ['number'],
            formats: {number: ['integer']},
            validations: {
              number: {
                ___ALL_FORMATS___: v => assert.typeof(v.value, 'number'),
                ___FALLBACK_FORMAT___: v => assert.ok(v.value, 'fails format'),
                integer: v => assert.ok(Number.isInteger(v.value), 'not an integer'),
              },
            },
          }

          model = new Model({}, validatorOptions)
        })

        it('should use ___ALL_FORMATS___', () => {
          model = model.type('number')
          expect(validate(1)).to.have.property('conforms', true)
          expect(validate('foo')).to.have.property('conforms', false)
          expect(validate(true)).to.have.property('conforms', false)
          expect(validate([])).to.have.property('conforms', false)

          model = model.type('number').format('integer')
          expect(validate('foo').errors[0])
            .to.have.property('message')
            .match(/expected.*number/)
        })

        it('should use ___FALLBACK_FORMAT___', () => {
          model = model.type('number')
          expect(validate(0)).to.have.property('conforms', false)
          model = model.type('number').format('integer')
          expect(validate(0)).to.have.property('conforms', true)
        })

        it('should use appropriate format', () => {
          model = model.type('number').format('integer')
          expect(validate(0)).to.have.property('conforms', true)
          expect(validate(1.1)).to.have.property('conforms', false)
          expect(validate(15)).to.have.property('conforms', true)
          expect(validate(5.23)).to.have.property('conforms', false)
        })
      })

      context('coerce', () => {
        beforeEach(() => {
          validatorOptions = {
            types: ['string'],
            formats: {string: ['phone', 'name']},
            coerce: {
              string: {
                ___ALL_FORMATS___: {
                  'coerce-type': v => v.setValue(`type: ${v.value}`),
                },
                ___FALLBACK_FORMAT___: {
                  'coerce-type': v => v.setValue(`format: ${v.value}`),
                },
                name: {
                  'coerce-type': v => v.setValue(`name: ${v.value}`),
                },
                phone: {
                  'coerce-type': v => v.setValue(v.value.replace(/[^\d]+/g, '')),
                },
              },
            },
          }

          model = new Model({}, validatorOptions)
        })

        it('should use ___ALL_FORMATS___', () => {
          model = model.type('string').format('name')
          expect(validate(1)).to.eql({
            conforms: true,
            value: 'name: type: 1',
            errors: [],
          })
        })

        it('should use ___FALLBACK_FORMAT___', () => {
          model = model.type('string')
          expect(validate(false)).to.eql({
            conforms: true,
            value: 'format: type: false',
            errors: [],
          })
        })

        it('should use appropriate format', () => {
          model = model.type('string').format('phone')
          expect(validate('+1 (555) 555-5555')).to.eql({
            conforms: true,
            value: '15555555555',
            errors: [],
          })
        })
      })
    })
  })
})
