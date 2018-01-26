/* eslint-disable no-undef, space-before-function-paren, no-extra-semi */
const _ = require('lodash')
const expect = require('chai').expect
const Model = require('../lib-ts/model').Model
const Validator = require('../lib-ts/validator').Validator
const assert = require('../lib-ts/errors/validation-error').assertions

describe('lib/validator.ts', () => {
  const defaultOptions = {
    types: ['number', 'string', 'object'],
    formats: {
      number: ['integer'],
      string: ['name'],
    },
    validations: {
      number: {
        ___ALL_FORMATS___: [v => assert.typeof(v.value, 'number')],
        integer: [v => assert.ok(Math.floor(v.value) === v.value)],
      },
      string: {___ALL_FORMATS___: [v => assert.typeof(v.value, 'string')]},
      object: {___ALL_FORMATS___: [v => assert.typeof(v.value, 'object')]},
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

    it.skip('should fail when type is not set', () => {
      expect(() => validate('Hello, world')).to.throw(/defined/)
    })

    it.skip('should fail loudly when told to', () => {
      ;(function() {
        new Model({type: 'number'}).validate({}, true)
      }.should.throw())
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
        const parser = val => 'something'
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
  })
})
