import * as _ from 'lodash'

import {
  IModel,
  IValidateOptions,
  IValidationResult,
  IValidatorOptionsUnsafe,
  ValidationPhase,
} from '../lib'
import * as assertionErrorModule from '../lib/errors/assertion-error'
import {Model} from '../lib/model'
import {Validator} from '../lib/validator'

const assert = assertionErrorModule.assert
const AssertionError = assertionErrorModule.AssertionError

describe('lib/validator.ts', () => {
  const defaultOptions: IValidatorOptionsUnsafe = {
    types: ['number', 'string', 'object', 'array'],
    validations: {
      number: {___ALL_FORMATS___: (v: IValidationResult) => assert.typeof(v.value, 'number')},
      string: {___ALL_FORMATS___: (v: IValidationResult) => assert.typeof(v.value, 'string')},
      object: {___ALL_FORMATS___: (v: IValidationResult) => assert.typeof(v.value, 'object')},
    },
  }

  describe('.validate', () => {
    let model: IModel, validatorOptions: IValidatorOptionsUnsafe

    beforeEach(() => {
      model = new Model({}, defaultOptions)
      validatorOptions = defaultOptions
    })

    const validate = (value: any, opts?: IValidateOptions) =>
      new Validator(model.spec, validatorOptions).validate(value, opts).toJSON()

    it('should work with no type', () => {
      expect(validate({})).toEqual({
        conforms: true,
        value: {},
        errors: [],
      })
    })

    it('should fail loudly when told to', () => {
      model = model.type('number')

      try {
        validate('not a number', {failLoudly: true})
        expect(false).toBe(true)
      } catch (err) {
        expect(err).toHaveProperty('value', 'not a number')
        expect(err).toHaveProperty('message', 'value failed validation')
        expect(err).toHaveProperty('errors')
        expect(err.errors).toHaveLength(1)
        expect(err.errors[0].message).toMatch(/expected.*number/)
        expect(err.errors[0].error).toBeInstanceOf(AssertionError)
      }
    })

    describe('required', () => {
      it('should conform when present', () => {
        model = model.type('object').required()
        expect(validate({})).toEqual({
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
        expect(validate(null)).toEqual({
          conforms: true,
          value: null,
          errors: [],
        })
      })

      it('should not conform when absent', () => {
        model = model.type('object').required()
        expect(validate(undefined)).toEqual({
          conforms: false,
          value: undefined,
          errors: [{message: 'expected value to be defined'}],
        })
      })
    })

    describe('nullable', () => {
      it('should not conform when null', () => {
        model = model.type('string').nullable(false)
        expect(validate(null)).toEqual({
          conforms: false,
          value: null,
          errors: [{message: 'expected value to be non-null'}],
        })
      })

      it('should conform even when required', () => {
        model = model
          .type('object')
          .required()
          .nullable()
        expect(validate(null)).toEqual({
          conforms: true,
          value: null,
          errors: [],
        })
      })
    })

    describe('default', () => {
      it('should fill in when undefined', () => {
        model = model.type('string').default('Hello, World')
        expect(validate(undefined, {failLoudly: true})).toEqual({
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
        expect(validate(undefined)).toEqual({
          conforms: false,
          value: undefined,
          errors: [{message: 'expected value to be defined'}],
        })
      })

      it('should not fill in when null', () => {
        model = model
          .type('number')
          .nullable()
          .default(1)
        expect(validate(null)).toEqual({
          conforms: true,
          value: null,
          errors: [],
        })
      })

      it('should still enforce non-null', () => {
        model = model.type('number').default(null)
        expect(validate(undefined)).toEqual({
          conforms: false,
          value: null,
          errors: [{message: 'expected value to be non-null'}],
        })
      })

      it('should still validate', () => {
        model = model
          .type('string')
          .default('Hello, World')
          .validations(/skrilla/)
        expect(validate(undefined)).toEqual({
          conforms: false,
          value: 'Hello, World',
          errors: [
            {
              message: 'expected value (Hello, World) to match /skrilla/',
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

        expect(validate(null)).toEqual({
          conforms: true,
          value: null,
          errors: [],
        })
      })
    })

    describe('enum', () => {
      it('should support simple types', () => {
        model = model.type('string').enum(['hello', 'bar'])
        expect(validate('hello')).toHaveProperty('conforms', true)
        expect(validate('bar')).toHaveProperty('conforms', true)
        expect(validate('other')).toHaveProperty('conforms', false)
        expect(validate(2)).toHaveProperty('conforms', false)
      })

      it('should provide useful errors when simple', () => {
        model = model.type('string').enum(['hello', 'bar'])
        const validation = validate('other')
        expect(validation).toHaveProperty('conforms', false)
        expect(validation).toHaveProperty('value', 'other')
        expect(validation.errors[0].message).toContain('one of [hello, bar]')
      })

      it('should support complex types', () => {
        const optionA = new Model({}, defaultOptions).type('string')
        const optionB = new Model({}, defaultOptions).type('object')
        model = model.enum([optionA, optionB])
        expect(validate(true)).toHaveProperty('conforms', false)
        expect(validate(1)).toHaveProperty('conforms', false)
        expect(validate({})).toHaveProperty('conforms', true)
        expect(validate('hello')).toHaveProperty('conforms', true)
      })

      it('should support deep complex types', () => {
        const optionA = new Model({}, defaultOptions).type('string')
        const optionB = new Model({}, defaultOptions).type('object')
        const optionChildB = new Model({}, defaultOptions).type('object').required()
        optionB.children({x: optionChildB})

        model = model.enum([optionA, optionB])
        expect(validate(true)).toHaveProperty('conforms', false)
        expect(validate(1)).toHaveProperty('conforms', false)
        expect(validate({x: {}})).toHaveProperty('conforms', true)
        expect(validate({x: 1})).toHaveProperty('conforms', false)
        expect(validate('hello')).toHaveProperty('conforms', true)
      })

      it('should support applies functions', () => {
        const optionA = new Model({}, defaultOptions)
          .type('string')
          .applies(result => result.rootValue.type === 'a')
        const optionB = new Model({}, defaultOptions)
          .type('number')
          .applies(result => result.rootValue.type === 'b')
        const typeModel = new Model({}, defaultOptions).enum(['a', 'b'])
        const valueModel = new Model({}, defaultOptions).enum([optionA, optionB])

        model = model.type('object').children({type: typeModel, value: valueModel})
        expect(validate({type: 'a', value: 'hello'})).toHaveProperty('conforms', true)
        expect(validate({type: 'b', value: 12})).toHaveProperty('conforms', true)
        expect(validate({type: 'b', value: 'oops'})).toEqual({
          conforms: false,
          value: {type: 'b', value: 'oops'},
          errors: [
            {
              message: 'expected value (oops) to have typeof number',
              path: ['value'],
            },
          ],
        })
      })

      it('should provide useful errors when complex', () => {
        const optionA = new Model({}, defaultOptions).type('string')
        const optionB = new Model({}, defaultOptions).type('object')
        model = model.enum([optionA, optionB])
        const validation = validate(1)
        expect(validation).toHaveProperty('conforms', false)
        expect(validation).toHaveProperty('value', 1)
        expect(validation.errors).toHaveLength(1)

        const error = validation.errors[0]
        expect(error.message).toMatch(/match.*enum/)
        expect(error.details).toHaveLength(2)
      })
    })

    describe('children', () => {
      let mkModel: () => IModel

      beforeEach(() => {
        mkModel = () => new Model({}, validatorOptions)
        validatorOptions.coerce = {
          number: {
            ___ALL_FORMATS___: {
              'coerce-type': result => result.setValue(Number(result.value)),
            },
          },
        }
      })

      it('should validate arrays', () => {
        const childModel = new Model({}, validatorOptions).type('number').required()
        model = model.type('array').children(childModel)
        expect(validate([1, '2', null, undefined, 5])).toEqual({
          conforms: false,
          value: [1, 2, null, undefined, 5],
          errors: [
            {message: 'expected value to be non-null', path: ['2']},
            {message: 'expected value to be defined', path: ['3']},
          ],
        })
      })

      it('should validate objects', () => {
        model = model.type('object').children({
          id: mkModel()
            .type('number')
            .required(),
          name: mkModel().type('string'),
          age: mkModel().type('number'),
          meta: mkModel()
            .type('object')
            .children({
              type: mkModel().type('string'),
              other: mkModel().type('number'),
            }),
        })

        expect(
          validate({
            id: '123',
            name: 12,
            age: 123,
            meta: {type: 123},
            extra: 'foo',
          }),
        ).toEqual({
          conforms: false,
          value: {
            id: 123,
            name: 12,
            age: 123,
            meta: {type: 123, other: undefined},
            extra: 'foo',
          },
          errors: [
            {
              message: 'expected value (12) to have typeof string',
              path: ['name'],
            },
            {
              message: 'expected value (123) to have typeof string',
              path: ['meta', 'type'],
            },
          ],
        })
      })

      it('should update nested root values as it goes', () => {
        let calledRootValue
        const stub = (vr: IValidationResult) => {
          calledRootValue = _.cloneDeep(vr.rootValue)
          return vr.setValue(vr.rootValue.z.zz.xxx + vr.rootValue.z.zz.yyy)
        }

        model = model.type('object').children({
          x: mkModel().coerce(vr => vr.setValue(1)),
          y: mkModel().coerce(vr => vr.setValue(2)),
          z: mkModel()
            .type('object')
            .children({
              xx: mkModel().coerce(vr => vr.setValue(3)),
              yy: mkModel().coerce(vr => vr.setValue(4)),
              zz: mkModel()
                .type('object')
                .children({
                  xxx: mkModel().coerce(vr => vr.setValue(5)),
                  yyy: mkModel().coerce(vr => vr.setValue(6)),
                  zzz: mkModel().coerce(stub),
                }),
            }),
        })

        const result = validate({
          x: 'x',
          y: 'y',
          z: {
            xx: 'xx',
            yy: 'yy',
            zz: {
              xxx: 'xxx',
              yyy: 'yyy',
              zzz: 'zzz',
            },
          },
        })

        expect(calledRootValue).toEqual({
          x: 1,
          y: 2,
          z: {
            xx: 3,
            yy: 4,
            zz: {
              xxx: 5,
              yyy: 6,
              zzz: 'zzz',
            },
          },
        })

        expect(result.value.z.zz.zzz).toBe(11)
      })
    })

    describe('coerce', () => {
      it('should use coerce before checking definedness', () => {
        const parser = (val: IValidationResult) => val.setValue('something')
        model = model
          .type('string')
          .required()
          .coerce(parser)

        expect(validate(null)).toEqual({
          conforms: true,
          value: 'something',
          errors: [],
        })
      })

      it('should still check definedness', () => {
        const parser = (val: IValidationResult) => val.setValue(undefined)
        model = model
          .type('string')
          .required()
          .coerce(parser)

        expect(validate(null)).toEqual({
          conforms: false,
          value: undefined,
          errors: [{message: 'expected value to be defined'}],
        })
      })

      it('should short-circuit', () => {
        const parser = (val: IValidationResult) => val.setValue('something').setIsFinished(true)
        model = model
          .type('string')
          .required()
          .coerce(parser)
          .validations(/skrilla/)

        expect(validate(null)).toEqual({
          conforms: true,
          value: 'something',
          errors: [],
        })
      })

      it('should use the correct phase', () => {
        const parser = (val: IValidationResult) => val.setValue('something')
        model = model
          .type('string')
          .required()
          .coerce(parser, ValidationPhase.ValidateValue)
          .validations(/skrilla/)

        expect(validate('skrilla')).toEqual({
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
          .coerce(parser as any)

        expect(() => validate('Hello, World')).toThrowError(/must return.*ValidationResult/)
      })
    })

    describe('validations [RegExp]', () => {
      it('should pass a valid match', () => {
        model = model
          .type('string')
          .required()
          .validations(/^foo.*bar$/)

        expect(validate('foo Anything Goes bar')).toEqual({
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

        expect(validate('Anything Goes bar')).toEqual({
          conforms: false,
          value: 'Anything Goes bar',
          errors: [
            {
              message: 'expected value (Anything Goes bar) to match /^foo.*bar$/',
            },
          ],
        })
      })

      it('should fail a non-string', () => {
        model = model.type('object').validations(/^foo.*bar$/)

        expect(validate({})).toEqual({
          conforms: false,
          value: {},
          errors: [
            {
              message: 'expected value ({}) to have typeof string',
            },
          ],
        })
      })
    })

    describe('validations [function]', () => {
      it('should pass a valid match', () => {
        model = model
          .type('string')
          .required()
          .validations(_.noop)

        expect(validate('Hello, World')).toEqual({
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

        expect(validate('Hello, World')).toEqual({
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

        expect(validate('Hello, World')).toEqual({
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

        expect(validate('Hello, World')).toEqual({
          conforms: false,
          value: 'Hello, World',
          errors: [
            {
              message: 'expected value (Hello, World) to match /missing/',
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

        expect(validate('Hello, World')).toEqual({
          conforms: false,
          value: 'Hello, World',
          errors: [{message: 'invalid value'}],
        })
      })
    })

    describe('validator-options', () => {
      describe('validations', () => {
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
          expect(validate(1)).toHaveProperty('conforms', true)
          expect(validate('foo')).toHaveProperty('conforms', false)
          expect(validate(true)).toHaveProperty('conforms', false)
          expect(validate([])).toHaveProperty('conforms', false)

          model = model.type('number').format('integer')
          expect(validate('foo').errors[0].message).toMatch(/expected.*number/)
        })

        it('should use ___FALLBACK_FORMAT___', () => {
          model = model.type('number')
          expect(validate(0)).toHaveProperty('conforms', false)
          model = model.type('number').format('integer')
          expect(validate(0)).toHaveProperty('conforms', true)
        })

        it('should use appropriate format', () => {
          model = model.type('number').format('integer')
          expect(validate(0)).toHaveProperty('conforms', true)
          expect(validate(1.1)).toHaveProperty('conforms', false)
          expect(validate(15)).toHaveProperty('conforms', true)
          expect(validate(5.23)).toHaveProperty('conforms', false)
        })
      })

      describe('coerce', () => {
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
          expect(validate(1)).toEqual({
            conforms: true,
            value: 'name: type: 1',
            errors: [],
          })
        })

        it('should use ___FALLBACK_FORMAT___', () => {
          model = model.type('string')
          expect(validate(false)).toEqual({
            conforms: true,
            value: 'format: type: false',
            errors: [],
          })
        })

        it('should use appropriate format', () => {
          model = model.type('string').format('phone')
          expect(validate('+1 (555) 555-5555')).toEqual({
            conforms: true,
            value: '15555555555',
            errors: [],
          })
        })
      })
    })
  })
})
