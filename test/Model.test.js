const assert = require('assert')

const _ = require('lodash')
const sinon = require('sinon')

const ValueRef = relativeRequire('ValueRef')
const ValidationResult = relativeRequire('ValidationResult')

defineTest('Model.js', Model => {
  describe('#constructor', () => {
    afterEach(() => {
      Model.reset()
    })

    it('should set spec properties', () => {
      Model.formats = {string: ['name']}
      const model = new Model({type: 'string', format: 'name'})
      model.should.have.deep.property('spec.type', 'string')
      model.should.have.deep.property('spec.format', 'name')
    })

    it('should set unknown spec properties', () => {
      const model = new Model({foobar: null, bazbam: 123})
      model.should.have.deep.property('spec.foobar', null)
      model.should.have.deep.property('spec.bazbam', 123)
    })

    it('should return the argument when it is already a model', () => {
      const modelA = new Model({type: 'string'})
      const modelB = new Model(modelA)
      modelA.should.equal(modelB)
    })

    it('should fail when argument is not an object', () => {
      (function () {
        new Model(1234) // eslint-disable-line no-new
      }).should.throw(Error)
    })

    it('should validate the spec properties', () => {
      (function () {
        new Model({type: 'asdf'}) // eslint-disable-line no-new
      }).should.throw()
    })

    it('should assign defaults to the spec', () => {
      Model.defaults = {required: true}
      Model.formats = {number: ['double']}
      const model = new Model({type: 'number', format: 'double'})
      model.should.have.deep.property('spec.type', 'number')
      model.should.have.deep.property('spec.format', 'double')
      model.should.have.deep.property('spec.required', true)
    })

    it('should override defaults with arguments', () => {
      Model.defaults = {required: true, strict: true}
      const model = new Model({type: 'object', required: false})
      model.should.have.deep.property('spec.required', false)
      model.should.have.deep.property('spec.strict', true)
    })

    it('should work with list spec properties', () => {
      Model.formats = {string: ['enum']}
      const model = new Model({type: 'string', format: 'enum', options: ['foo', 'bar']})
      model.should.have.deep.property('spec.type', 'string')
      model.should.have.deep.property('spec.format', 'enum')
      model.should.have.deep.property('spec.options').eql(['foo', 'bar'])
    })

    it('should not have hooks by default', () => {
      (typeof Model.hooks.constructor).should.equal('undefined')
    })

    it('should call appropriate hooks', () => {
      const hook = sinon.stub()
      Model.hooks.constructor = [hook]
      const model = new Model({type: 'string'})
      hook.should.have.been.calledOn(model)
    })
  })

  describe('immutability', () => {
    it('should use distinct values when modifying properties', () => {
      const validation = _.noop
      const modelA = new Model({type: 'string'}).validation(validation)
      const modelB = modelA.type('number')
      const modelC = modelA.validation(validation)

      modelA.spec.should.have.property('validations').length(1)
      modelB.spec.should.have.property('validations').length(1)
      modelC.spec.should.have.property('validations').length(2)
    })

    it('should be immune to tampering with clones', () => {
      const children = [
        {name: 'id', model: new Model({type: 'number'})},
        {name: 'name', model: new Model({type: 'string'})},
      ]

      const modelA = new Model({type: 'object', children})
      const modelB = modelA.validation(_.noop)
      modelB.spec.children[0].model.spec.type = 'undefined'
      modelA.spec.should.have.deep.property('children.0.model.spec.type', 'number')
    })

    it('should be immune to tampering with underlying', () => {
      const children = [
        {name: 'id', model: new Model({type: 'number'})},
        {name: 'name', model: new Model({type: 'string'})},
      ]

      const validations = [_.noop]

      const modelA = new Model({type: 'object', children, validations})
      validations.push(_.noop)
      children[0].name = 'other'
      children.push({name: 'foobar', model: new Model({type: 'string'})})
      modelA.spec.should.have.property('children').length(2)
      modelA.spec.should.have.property('validations').length(1)
      modelA.spec.should.have.deep.property('children.0.name', 'id')
    })
  })

  describe('#type', () => {
    it('should set spec.type', () => {
      const model = new Model().type('string')
      model.spec.should.have.property('type', 'string')
    })

    it('should fail when unknown type is used', () => {
      (function () {
        new Model().type('missingTypeA')
      }).should.throw()
    })

    it('should respect new types', () => {
      Model.types.push('missingTypeA')
      const model = new Model().type('missingTypeA')
      model.spec.should.have.property('type', 'missingTypeA')
      Model.reset()
    })
  })

  describe('#format', () => {
    beforeEach(() => {
      Model.formats = {string: ['name', 'address', 'zip'], number: ['integer']}
    })

    afterEach(() => {
      Model.reset()
    })

    it('should set spec.format', () => {
      const model = new Model().type('string').format('name')
      model.spec.should.have.property('format', 'name')
    })

    it('should default spec.formatOptions to empty', () => {
      const model = new Model().type('string').format('address')
      model.spec.should.have.property('formatOptions').eql({})
    })

    it('should set spec.formatOptions', () => {
      const options = {extended: true}
      const model = new Model().type('string').format('zip', options)
      model.spec.should.have.property('formatOptions').eql(options)
    })

    it('should fail when type is not set yet', () => {
      (function () {
        new Model().format('name')
      }).should.throw()
    })

    it('should fail when format is not available for type', () => {
      (function () {
        new Model().type('number').format('name')
      }).should.throw()
    })

    it('should fail when unknown format is used', () => {
      (function () {
        new Model().type('string').format('missing')
      }).should.throw()
    })
  })

  describe('#required', () => {
    it('should set spec.required', () => {
      const model = new Model({required: false}).required()
      model.spec.should.have.property('required', true)
    })

    it('should set spec.required', () => {
      const model = new Model({required: true}).required(false)
      model.spec.should.have.property('required', false)
    })

    it('should fail when required is not a boolean', () => {
      (function () {
        new Model().required('true')
      }).should.throw()
    })
  })

  describe('#optional', () => {
    it('should set spec.required', () => {
      const model = new Model({required: true}).optional()
      model.spec.should.have.property('required', false)
    })

    it('should set spec.required', () => {
      const model = new Model({required: false}).optional(false)
      model.spec.should.have.property('required', true)
    })

    it('should fail when required is not a boolean', () => {
      (function () {
        new Model().optional(0)
      }).should.throw()
    })
  })

  describe('#nullable', () => {
    it('should set spec.nullable', () => {
      const model = new Model({nullable: false}).nullable()
      model.spec.should.have.property('nullable', true)
    })

    it('should set spec.nullable', () => {
      const model = new Model({nullable: true}).nullable(false)
      model.spec.should.have.property('nullable', false)
    })

    it('should fail when nullable is not a boolean', () => {
      (function () {
        new Model().nullable('false')
      }).should.throw()
    })
  })

  describe('#strict', () => {
    it('should set spec.strict', () => {
      const model = new Model({type: 'object', strict: false}).strict()
      model.spec.should.have.property('strict', true)
    })

    it('should set spec.strict', () => {
      const model = new Model({type: 'object', strict: true}).strict(false)
      model.spec.should.have.property('strict', false)
    })

    it('should fail when strict is not a boolean', () => {
      (function () {
        new Model().type('object').strict('false')
      }).should.throw()
    })
  })

  describe('#default', () => {
    it('should set spec.default', () => {
      const model = new Model().type('string').default('foobar')
      model.spec.should.have.property('default', 'foobar')
    })

    it('should set spec.default as array', () => {
      const arr = [1, 2, 3]
      const model = new Model().type('array').default(arr)
      model.spec.should.have.property('default').eql(arr)
    })

    it('should unset spec.default', () => {
      const model = new Model({type: 'number', default: 1}).default()
      model.spec.should.have.property('default', undefined)
    })

    it('should fail when type is not set', () => {
      (function () {
        new Model().default('something')
      }).should.throw()
    })

    it('should fail when default is not the same type as model', () => {
      (function () {
        new Model().type('number').default('12')
      }).should.throw()
    })

    it('should fail when default is not array but type is', () => {
      (function () {
        new Model().type('array').default({0: 1})
      }).should.throw()
    })
  })

  describe('#parse', () => {
    it('should set spec.parse', () => {
      const parse = function () {}
      const model = new Model().parse(parse)
      model.spec.should.have.property('parse', parse)
    })

    it('should fail when parse is not a function', () => {
      (function () {
        new Model().parse('false')
      }).should.throw()
    })
  })

  describe('#transform', () => {
    it('should set spec.transform', () => {
      const transform = function () {}
      const model = new Model().transform(transform)
      model.spec.should.have.property('transform', transform)
    })

    it('should fail when transform is not a function', () => {
      (function () {
        new Model().transform({})
      }).should.throw()
    })
  })

  describe('#options', () => {
    it('should set spec.options', () => {
      const model = new Model().type('string').options(['foo', 'bar'])
      model.spec.should.have.property('options').eql(['foo', 'bar'])
    })

    it('should fail when type is not set yet', () => {
      (function () {
        new Model().options(['foo'])
      }).should.throw()
    })

    it('should fail when type of option doesn\'t match type', () => {
      (function () {
        new Model().type('number').options([1, null])
      }).should.throw()
    })
  })

  describe('#option', () => {
    it('should fail when type is not set yet', () => {
      (function () {
        new Model().option('foo')
      }).should.throw()
    })

    it('should fail when type of option doesn\'t match type', () => {
      (function () {
        new Model().type('number').option(null)
      }).should.throw()
    })

    context('when type is primitive', () => {
      it('should set spec.options first element', () => {
        const model = new Model().type('string').option('foo')
        model.spec.should.have.property('options').eql(['foo'])
      })

      it('should set spec.options second element', () => {
        const model = new Model().type('string').option('foo').option('bar')
        model.spec.should.have.property('options').eql(['foo', 'bar'])
      })

      it('should set spec.options first element as number', () => {
        const model = new Model().type('number').option(13)
        model.spec.should.have.property('options').eql([13])
      })
    })

    context('when type is conditional', () => {
      it('should set spec.options first element with condition', () => {
        const sModel = new Model({type: 'string'})
        const sRef = new ValueRef('foobar')
        const sCondition = s => typeof s === 'string'
        const model = new Model().type('conditional').option(sModel, sRef, sCondition)
        const expectation = [{model: sModel, ref: sRef, condition: sCondition}]
        model.spec.should.have.property('options').eql(expectation)
      })

      it('should set spec.options first element with string condition', () => {
        const sModel = new Model({type: 'string'})
        const model = new Model().type('conditional').option(sModel, 'path', 'value')
        model.spec.should.have.deep.property('options.0.model').eql(sModel)
        model.spec.should.have.deep.property('options.0.ref.path', 'path')
        model.spec.should.have.deep.property('options.0.condition').is.a('function')
      })

      it('should set spec.options first element with array condition', () => {
        const sModel = new Model({type: 'string'})
        const model = new Model().type('conditional').option(sModel, ['path1', 'path2'], [0, 1])
        model.spec.should.have.deep.property('options.0.model').eql(sModel)
        model.spec.should.have.deep.property('options.0.ref.0.path', 'path1')
        model.spec.should.have.deep.property('options.0.ref.1.path', 'path2')
        model.spec.should.have.deep.property('options.0.condition').is.a('function')
      })

      it('should set spec.options first element without condition', () => {
        const sModel = new Model({type: 'string'})
        const model = new Model().type('conditional').option(sModel)
        model.spec.should.have.property('options').eql([{model: sModel}])
      })

      it('should set spec.options second element without condition', () => {
        const sModel = new Model({type: 'string'})
        const iModel = new Model({type: 'number'})
        const iRef = new ValueRef('foobar')
        const iCondition = s => typeof s === 'number'
        const model = new Model()
          .type('conditional')
          .option(sModel)
          .option(iModel, iRef, iCondition)
        model.spec.should.have.property('options').eql([
          {model: sModel},
          {model: iModel, ref: iRef, condition: iCondition},
        ])
      })

      it('should fail when first argument is not model', () => {
        (function () {
          new Model().type('conditional').option('string')
        }).should.throw()
      })

      it('should fail when second argument is not a path', () => {
        (function () {
          new Model().type('conditional').option(new Model(), {}, _.noop)
        }).should.throw()
      })

      it('should fail when third argument is missing', () => {
        (function () {
          new Model().type('conditional').option(new Model(), 'path')
        }).should.throw()
      })
    })
  })

  describe('#children', () => {
    it('should set spec.children when object', () => {
      const childModel = {
        first: new Model({type: 'string'}),
        second: new Model({type: 'number'}),
      }

      const model = new Model().type('object').children(childModel)
      model.spec.should.have.property('children').eql([
        {name: 'first', model: childModel.first},
        {name: 'second', model: childModel.second},
      ])
    })

    it('should set spec.children when array', () => {
      const childModel = new Model({type: 'string'})

      const model = new Model().type('array').children(childModel)
      model.spec.should.have.property('children').eql(childModel)
    })

    it('should call appropriate hooks', () => {
      const hook = sinon.stub()
      Model.hooks.children = [hook]
      const childModel = new Model({type: 'string'})

      const model = new Model().type('array').children(childModel)
      model.spec.should.have.property('children').eql(childModel)
      hook.should.have.been.calledOn(model)
      Model.reset()
    })

    it('should fail when given undefined', () => {
      (function () {
        new Model().type('object').children()
      }).should.throw()
    })

    it('should fail when given a non-object', () => {
      (function () {
        new Model().type('object').children('something')
      }).should.throw()
    })

    it('should fail when set on a non-object Model', () => {
      (function () {
        new Model().type('string').children({})
      }).should.throw()
    })

    it('should fail when given a non-spec conforming object', () => {
      (function () {
        new Model().type('object').children({unknown: 'foobar'})
      }).should.throw()
    })

    it('should fail when type is object and is given a model', () => {
      (function () {
        new Model().type('object').children(new Model())
      }).should.throw()
    })
  })

  describe('#pick', () => {
    it('should limit the children to named fields', () => {
      const childModel = {
        first: new Model({type: 'string'}),
        second: new Model({type: 'number'}),
        third: new Model({type: 'object'}),
      }

      const model = new Model().type('object').children(childModel)
      model.spec.should.have.property('children').length(3)
      model.pick(['first', 'third']).spec.should.have.property('children').eql([
        {name: 'first', model: childModel.first},
        {name: 'third', model: childModel.third},
      ])
    })

    it('should limit the children to named single field', () => {
      const childModel = {
        first: new Model({type: 'string'}),
        second: new Model({type: 'number'}),
        third: new Model({type: 'object'}),
      }

      const model = new Model().type('object').children(childModel)
      model.spec.should.have.property('children').length(3)
      model.pick('second').spec.should.have.property('children').eql([
        {name: 'second', model: childModel.second},
      ])
    })

    it('should not fail when no children exist', () => {
      const model = new Model().type('object')
      model.pick('second').spec.should.have.property('children').eql([])
    })
  })

  describe('#omit', () => {
    it('should limit the children to not named fields', () => {
      const childModel = {
        first: new Model({type: 'string'}),
        second: new Model({type: 'number'}),
        third: new Model({type: 'object'}),
      }

      const model = new Model().type('object').children(childModel)
      model.spec.should.have.property('children').length(3)
      model.omit(['second', 'first']).spec.should.have.property('children').eql([
        {name: 'third', model: childModel.third},
      ])
    })

    it('should limit the children to not the named field', () => {
      const childModel = {
        first: new Model({type: 'string'}),
        second: new Model({type: 'number'}),
        third: new Model({type: 'object'}),
      }

      const model = new Model().type('object').children(childModel)
      model.spec.should.have.property('children').length(3)
      model.omit('first').spec.should.have.property('children').eql([
        {name: 'second', model: childModel.second},
        {name: 'third', model: childModel.third},
      ])
    })

    it('should not fail when no children exist', () => {
      const model = new Model().type('object')
      model.omit('random').spec.should.have.property('children').eql([])
    })
  })

  describe('#merge', () => {
    it('should take the union of both objects', () => {
      const childModelA = {
        first: new Model({type: 'string'}),
        second: new Model({type: 'number'}),
      }

      const childModelB = {
        third: new Model({type: 'boolean'}),
        fourth: new Model({type: 'string'}),
      }

      const modelA = new Model().type('object').children(childModelA)
      const modelB = new Model().type('object').children(childModelB)
      modelA.merge(modelB).spec.should.have.property('children').eql([
        {name: 'first', model: childModelA.first},
        {name: 'second', model: childModelA.second},
        {name: 'third', model: childModelB.third},
        {name: 'fourth', model: childModelB.fourth},
      ])
    })

    it('should fail when given a conflicting model', () => {
      const childModelA = {
        first: new Model({type: 'string'}),
        second: new Model({type: 'number'}),
        third: new Model({type: 'object'}),
      }

      const childModelB = {second: new Model({type: 'boolean'})}

      const modelA = new Model().type('object').children(childModelA)
      const modelB = new Model().type('object').children(childModelB);
      (function () {
        modelA.merge(modelB)
      }).should.throw(/cannot merge conflicting models/)
    })

    it('should fail when given a non-model', () => {
      const childModel = {
        first: new Model({type: 'string'}),
        second: new Model({type: 'number'}),
        third: new Model({type: 'object'}),
      }

      const model = new Model().type('object').children(childModel);
      (function () {
        model.merge({})
      }).should.throw(/can only merge with another model/)
    })

    it('should not fail when no children exist', () => {
      const modelA = new Model().type('object')
      const modelB = new Model().type('object')
      modelA.merge(modelB).spec.should.have.property('children').eql([])
    })
  })

  describe('#validations', () => {
    it('should set spec.validations when regex', () => {
      const regex = /^something|else$/
      const model = new Model().type('string').validations([regex])
      model.spec.should.have.property('validations').eql([regex])
    })

    it('should set spec.validations when function', () => {
      const validate = function () { }
      const model = new Model().type('number').validations([validate])
      model.spec.should.have.property('validations').eql([validate])
    })

    it('should set spec.validations when array of functions', () => {
      const validateA = function () { }
      const validateB = function () { }
      const validate = [validateA, validateB]
      const model = new Model().validations(validate)
      model.spec.should.have.property('validations').eql(validate)
    })

    it('should fail when given a non-array', () => {
      (function () {
        new Model().validations('random')
      }).should.throw()
    })

    it('should fail when given a regexp and type is not string', () => {
      (function () {
        new Model().validations([/foo/])
      }).should.throw()
    })

    it('should fail when given an array with invalid values', () => {
      (function () {
        new Model().validations([function () {}, 'other'])
      }).should.throw()
    })
  })

  describe('#validate', () => {
    it('should fail when type is not set', () => {
      (function () {
        new Model().validate('test')
      }).should.throw(/defined/)
    })

    it('should fail loudly when told to', () => {
      (function () {
        new Model({type: 'number'}).validate({}, true)
      }).should.throw()
    })

    context('when required', () => {
      it('should conform when present', () => {
        const model = new Model({type: 'string', required: true})
        model.validate('foobar').asObject().should.eql({
          conforms: true,
          value: 'foobar',
          errors: [],
        })
      })

      it('should conform when present', () => {
        const model = new Model({type: 'string', required: true})
        model.validate(null).asObject().should.eql({
          conforms: true,
          value: null,
          errors: [],
        })
      })

      it('should not conform when absent', () => {
        const model = new Model({type: 'string', required: true})
        model.validate(undefined).asObject().should.eql({
          conforms: false,
          errors: [{message: 'expected value to be defined'}],
        })
      })
    })

    context('when not nullable', () => {
      it('should not conform when null', () => {
        const model = new Model({type: 'string', nullable: false})
        model.validate(null).asObject().should.eql({
          conforms: false,
          value: null,
          errors: [{message: 'expected value to be non-null'}],
        })
      })

      it('should conform even when required', () => {
        const model = new Model({type: 'string', required: true, nullable: true})
        model.validate(null).asObject().should.eql({
          conforms: true,
          value: null,
          errors: [],
        })
      })
    })

    context('when default is set', () => {
      it('should fill in when undefined', () => {
        const model = new Model({type: 'string', default: 'hello world'})
        model.validate(undefined).asObject().should.eql({
          conforms: true,
          value: 'hello world',
          errors: [],
        })
      })

      it('should fill in when undefined and value is required', () => {
        const model = new Model({type: 'number', default: 123, required: true})
        model.validate(undefined).asObject().should.eql({
          conforms: true,
          value: 123,
          errors: [],
        })
      })

      it('should not fill in when null', () => {
        const model = new Model({type: 'string', default: 'hello world'})
        model.validate(null).asObject().should.eql({
          conforms: true,
          value: null,
          errors: [],
        })
      })

      it('should still validate', () => {
        const model = new Model({
          type: 'string',
          default: 'hello world',
          validations: [function () {
            assert.ok(false, 'oops')
          }],
        })

        model.validate(undefined).asObject().should.eql({
          conforms: false,
          value: 'hello world',
          errors: [{message: 'oops'}],
        })
      })

      it('should still validate except when Nil', () => {
        const model = new Model({
          type: 'string',
          default: null,
          validations: [function () {
            assert.ok(false, 'oops')
          }],
        })

        model.validate(undefined).asObject().should.eql({
          conforms: true,
          value: null,
          errors: [],
        })
      })
    })

    context('when parse is set', () => {
      it('should use parse before checking definedness', () => {
        const parser = function () {
          return 'something'
        }
        const model = new Model({type: 'string', parse: parser, required: true})
        model.validate(undefined).asObject().should.eql({
          conforms: true,
          value: 'something',
          errors: [],
        })
      })

      it('should still check definedness', () => {
        const parser = function () { }
        const model = new Model({type: 'string', parse: parser, required: true})
        model.validate('something').asObject().should.eql({
          conforms: false,
          errors: [{message: 'expected value to be defined'}],
        })
      })

      it('should short-circuit when returning ValidationResult', () => {
        const parser = function () {
          return new ValidationResult('foo', true)
        }
        const validations = function () {
          assert.ok(false, 'yikes')
        }
        const model = new Model({
          type: 'string',
          parse: parser,
          validations: [validations],
        })

        model.validate('something').asObject().should.eql({
          conforms: true,
          value: 'foo',
          errors: [],
        })
      })
    })

    context('when transform is set', () => {
      it('should transform the value', () => {
        const transform = function (value) {
          return Number(value)
        }
        const model = new Model({type: 'number', transform})
        model.validate('123').asObject().should.eql({
          conforms: true,
          value: 123,
          errors: [],
        })
      })

      it('should short-circuit when returning failed validation result', () => {
        const transform = function () {
          return new ValidationResult(10, false, ['message'])
        }

        const model = new Model({type: 'number', transform})
        model.validate('foo').asObject().should.eql({
          value: 10,
          conforms: false,
          errors: ['message'],
        })
      })

      it('should not short-circuit when returning successful validation result', () => {
        const transform = function () {
          return new ValidationResult(10, true)
        }

        const validate = function () {
          assert.ok(false, 'done')
        }

        const model = new Model({
          type: 'number',
          transform,
          validations: [validate],
        })

        model.validate(123).asObject().should.eql({
          value: 10,
          conforms: false,
          errors: [{message: 'done'}],
        })
      })
    })

    context('when validations is a RegExp', () => {
      it('should pass a valid match', () => {
        const model = new Model({type: 'string', validations: [/^foo.*bar$/]})
        model.validate('fooANYTHINGbar').asObject().should.eql({
          value: 'fooANYTHINGbar',
          conforms: true,
          errors: [],
        })
      })

      it('should fail an invalid match', () => {
        const model = new Model({type: 'string', validations: [/^foo.*bar$/]})
        model.validate('somethingElsebar').asObject().should.eql({
          value: 'somethingElsebar',
          conforms: false,
          errors: [{message: 'expected somethingElsebar to match /^foo.*bar$/'}],
        })
      })

      it('should fail a non-string', () => {
        const model = new Model({type: 'string', validations: [/\d+/]})
        model.validate(12312).asObject().should.eql({
          value: 12312,
          conforms: false,
          errors: [{message: 'expected 12312 to have typeof string'}],
        })
      })
    })

    context('when validations is an array', () => {
      it('should pass a valid match', () => {
        const model = new Model({type: 'string', validations: [_.noop, _.noop]})
        model.validate('a string').asObject().should.eql({
          value: 'a string',
          conforms: true,
          errors: [],
        })
      })

      it('should fail when one element fails', () => {
        const fail = function () {
          assert.ok(false, 'oops')
        }
        const model = new Model({type: 'number', validations: [_.noop, fail, _.noop]})
        model.validate(123).asObject().should.eql({
          value: 123,
          conforms: false,
          errors: [{message: 'oops'}],
        })
      })
    })

    context('when type is conditional', () => {
      let model, topLevelModel

      beforeEach(() => {
        model = new Model({type: 'conditional'})
          .option(new Model({type: 'string'}), value => value === 'special')
          .option(new Model({type: 'array'}), 'length', 5)
          .option(new Model({type: 'boolean'}), 'id', value => value > 10)
          .option(new Model({type: 'number'}), ['id', 'type'], [42, 'special'])

        topLevelModel = () => new Model({type: 'object'})
          .children({
            id: new Model({type: 'number'}),
            type: new Model({type: 'string'}),
            conditional: model,
          })
      })

      context('when no options apply', () => {
        it('should immediately conform when strict is false', () => {
          model.validate({}).asObject().should.eql({
            value: {},
            conforms: true,
            errors: [],
          })
        })

        it('should fail when strict is true', () => {
          model.strict().validate({}).asObject().should.eql({
            value: {},
            conforms: false,
            errors: [{message: 'no applicable models for strict conditional'}],
          })
        })
      })

      context('when a single option applies', () => {
        beforeEach(() => {
          model = model.strict()
        })

        it('should conform when simple model conforms', () => {
          model.validate('special').asObject().should.eql({
            value: 'special',
            conforms: true,
            errors: [],
          })
        })

        it('should conform when complex model conforms', () => {
          topLevelModel().validate({id: 12, conditional: 'true'}).asObject().should.eql({
            value: {id: 12, conditional: true},
            conforms: true,
            errors: [],
          })
        })

        it('should conform when complex refs conform', () => {
          topLevelModel().validate({
            id: 42, type: 'special',
            conditional: '500',
          }).asObject().should.eql({
            value: {id: 42, type: 'special', conditional: 500},
            conforms: true,
            errors: [],
          })
        })

        it('should fail when simple model fails', () => {
          model.validate('12345').asObject().should.eql({
            value: '12345',
            conforms: false,
            errors: [{message: 'expected "12345" to have typeof array'}],
          })
        })

        it('should fail when complex model fails', () => {
          topLevelModel().validate({id: 12, conditional: 1234}).asObject().should.eql({
            value: {id: 12, conditional: 1234},
            conforms: false,
            errors: [
              {path: 'conditional', message: 'expected 1234 to have typeof boolean'},
            ],
          })
        })
      })

      context('when multiple options apply', () => {
        beforeEach(() => {
          model = new Model({type: 'conditional'})
            .option(new Model({type: 'number'}))
            .option(new Model({type: 'boolean'}))
            .option(new Model({type: 'string'}))
            .option(new Model({type: 'array'}), 'id', 15)
        })

        it('should pass when the first option passes', () => {
          model.validate('1234').asObject().should.eql({
            value: 1234,
            conforms: true,
            errors: [],
          })
        })

        it('should pass when the second option passes', () => {
          model.validate('false').asObject().should.eql({
            value: false,
            conforms: true,
            errors: [],
          })
        })

        it('should pass when the third option passes', () => {
          model.validate('foobar').asObject().should.eql({
            value: 'foobar',
            conforms: true,
            errors: [],
          })
        })

        it('should fail when no option passes', () => {
          topLevelModel().validate({id: 1, conditional: []}).asObject().should.eql({
            value: {id: 1, conditional: []},
            conforms: false,
            errors: [
              {path: 'conditional', message: 'expected [] to have typeof number'},
              {path: 'conditional', message: 'expected [] to have typeof boolean'},
              {path: 'conditional', message: 'expected [] to have typeof string'},
            ],
          })
        })
      })
    })
  })
})
