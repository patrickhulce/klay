/* eslint-disable no-undef, space-before-function-paren, no-extra-semi */
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
          value: undefined,
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

    context.skip('when parse is set', () => {
      it('should use parse before checking definedness', () => {
        const parser = function() {
          return 'something'
        }
        const model = new Model({type: 'string', parse: parser, required: true})
        model
          .validate(undefined)
          .asObject()
          .should.eql({
            conforms: true,
            value: 'something',
            errors: [],
          })
      })

      it('should still check definedness', () => {
        const parser = function() {}
        const model = new Model({type: 'string', parse: parser, required: true})
        model
          .validate('something')
          .asObject()
          .should.eql({
            conforms: false,
            errors: [{message: 'expected value to be defined'}],
          })
      })

      it('should short-circuit when returning ValidationResult', () => {
        const parser = function() {
          return new ValidationResult('foo', true)
        }
        const validations = function() {
          assert.ok(false, 'yikes')
        }
        const model = new Model({
          type: 'string',
          parse: parser,
          validations: [validations],
        })

        model
          .validate('something')
          .asObject()
          .should.eql({
            conforms: true,
            value: 'foo',
            errors: [],
          })
      })
    })

    context.skip('when transform is set', () => {
      it('should transform the value', () => {
        const transform = function(value) {
          return Number(value)
        }
        const model = new Model({type: 'number', transform})
        model
          .validate('123')
          .asObject()
          .should.eql({
            conforms: true,
            value: 123,
            errors: [],
          })
      })

      it('should short-circuit when returning failed validation result', () => {
        const transform = function() {
          return new ValidationResult(10, false, ['message'])
        }

        const model = new Model({type: 'number', transform})
        model
          .validate('foo')
          .asObject()
          .should.eql({
            value: 10,
            conforms: false,
            errors: ['message'],
          })
      })

      it('should not short-circuit when returning successful validation result', () => {
        const transform = function() {
          return new ValidationResult(10, true)
        }

        const validate = function() {
          assert.ok(false, 'done')
        }

        const model = new Model({
          type: 'number',
          transform,
          validations: [validate],
        })

        model
          .validate(123)
          .asObject()
          .should.eql({
            value: 10,
            conforms: false,
            errors: [{message: 'done'}],
          })
      })
    })

    context.skip('when validations is a RegExp', () => {
      it('should pass a valid match', () => {
        const model = new Model({type: 'string', validations: [/^foo.*bar$/]})
        model
          .validate('fooANYTHINGbar')
          .asObject()
          .should.eql({
            value: 'fooANYTHINGbar',
            conforms: true,
            errors: [],
          })
      })

      it('should fail an invalid match', () => {
        const model = new Model({type: 'string', validations: [/^foo.*bar$/]})
        model
          .validate('somethingElsebar')
          .asObject()
          .should.eql({
            value: 'somethingElsebar',
            conforms: false,
            errors: [{message: 'expected somethingElsebar to match /^foo.*bar$/'}],
          })
      })

      it('should fail a non-string', () => {
        const model = new Model({type: 'string', validations: [/\d+/]})
        model
          .validate(12312)
          .asObject()
          .should.eql({
            value: 12312,
            conforms: false,
            errors: [{message: 'expected 12312 to have typeof string'}],
          })
      })
    })

    context.skip('when validations is an array', () => {
      it('should pass a valid match', () => {
        const model = new Model({type: 'string', validations: [_.noop, _.noop]})
        model
          .validate('a string')
          .asObject()
          .should.eql({
            value: 'a string',
            conforms: true,
            errors: [],
          })
      })

      it('should fail when one element fails', () => {
        const fail = function() {
          assert.ok(false, 'oops')
        }
        const model = new Model({type: 'number', validations: [_.noop, fail, _.noop]})
        model
          .validate(123)
          .asObject()
          .should.eql({
            value: 123,
            conforms: false,
            errors: [{message: 'oops'}],
          })
      })
    })
  })
})
