var _ = require('lodash');
var assert = require('assert');
var ValueRef = relativeRequire('ValueRef');
var ValidationError = relativeRequire('ValidationError');
var ValidationResult = relativeRequire('ValidationResult');

ValidationResult.prototype.asObject = function () {
  return JSON.parse(JSON.stringify(this));
};

defineTest('Model.js', function (Model) {
  describe('#constructor', function () {
    afterEach(function () { Model.reset(); });

    it('should set spec properties', function () {
      Model.formats = {string: ['name']};
      var model = new Model({type: 'string', format: 'name'});
      model.should.have.deep.property('spec.type', 'string');
      model.should.have.deep.property('spec.format', 'name');
    });

    it('should set unknown spec properties', function () {
      var model = new Model({foobar: null, bazbam: 123});
      model.should.have.deep.property('spec.foobar', null);
      model.should.have.deep.property('spec.bazbam', 123);
    });

    it('should return the argument when it is already a model', function () {
      var modelA = new Model({type: 'string'});
      var modelB = new Model(modelA);
      modelA.should.equal(modelB);
    });

    it('should fail when argument is not an object', function () {
      (function () {
        new Model(1234);
      }).should.throw(Error);
    });

    it('should validate the spec properties', function () {
      (function () {
        new Model({type: 'asdf'});
      }).should.throw();
    });

    it('should assign defaults to the spec', function () {
      Model.defaults = {required: true};
      Model.formats = {number: ['double']};
      var model = new Model({type: 'number', format: 'double'});
      model.should.have.deep.property('spec.type', 'number');
      model.should.have.deep.property('spec.format', 'double');
      model.should.have.deep.property('spec.required', true);
    });

    it('should override defaults with arguments', function () {
      Model.defaults = {required: true, strict: true};
      var model = new Model({type: 'object', required: false});
      model.should.have.deep.property('spec.required', false);
      model.should.have.deep.property('spec.strict', true);
    });

    it('should work with list spec properties', function () {
      Model.formats = {string: ['enum']};
      var model = new Model({type: 'string', format: 'enum', options: ['foo', 'bar']});
      model.should.have.deep.property('spec.type', 'string');
      model.should.have.deep.property('spec.format', 'enum');
      model.should.have.deep.property('spec.options').eql(['foo', 'bar']);
    });
  });

  describe('#type', function () {
    it('should set spec.type', function () {
      var model = new Model().type('string');
      model.spec.should.have.property('type', 'string');
    });

    it('should fail when unknown type is used', function () {
      (function () {
        new Model().type('missingTypeA');
      }).should.throw();
    });

    it('should respect new types', function () {
      Model.types.push('missingTypeA');
      var model = new Model().type('missingTypeA');
      model.spec.should.have.property('type', 'missingTypeA');
      Model.reset();
    });
  });

  describe('#format', function () {
    beforeEach(function () {
      Model.formats = {string: ['name', 'address', 'zip'], number: ['integer']};
    });

    afterEach(function () {
      Model.reset();
    });

    it('should set spec.format', function () {
      var model = new Model().type('string').format('name');
      model.spec.should.have.property('format', 'name');
    });

    it('should default spec.formatOptions to empty', function () {
      var model = new Model().type('string').format('address');
      model.spec.should.have.property('formatOptions').eql({});
    });

    it('should set spec.formatOptions', function () {
      var options = {extended: true};
      var model = new Model().type('string').format('zip', options);
      model.spec.should.have.property('formatOptions', options);
    });

    it('should fail when type is not set yet', function () {
      (function () {
        new Model().format('name');
      }).should.throw();
    });

    it('should fail when format is not available for type', function () {
      (function () {
        new Model().type('number').format('name');
      }).should.throw();
    });

    it('should fail when unknown format is used', function () {
      (function () {
        new Model().type('string').format('missing');
      }).should.throw();
    });
  });

  describe('#required', function () {
    it('should set spec.required', function () {
      var model = new Model({required: false}).required();
      model.spec.should.have.property('required', true);
    });

    it('should set spec.required', function () {
      var model = new Model({required: true}).required(false);
      model.spec.should.have.property('required', false);
    });

    it('should fail when required is not a boolean', function () {
      (function () {
        new Model().required('true');
      }).should.throw();
    });
  });

  describe('#optional', function () {
    it('should set spec.required', function () {
      var model = new Model({required: true}).optional();
      model.spec.should.have.property('required', false);
    });

    it('should set spec.required', function () {
      var model = new Model({required: false}).optional(false);
      model.spec.should.have.property('required', true);
    });

    it('should fail when required is not a boolean', function () {
      (function () {
        new Model().optional(0);
      }).should.throw();
    });
  });

  describe('#nullable', function () {
    it('should set spec.nullable', function () {
      var model = new Model({nullable: false}).nullable();
      model.spec.should.have.property('nullable', true);
    });

    it('should set spec.nullable', function () {
      var model = new Model({nullable: true}).nullable(false);
      model.spec.should.have.property('nullable', false);
    });

    it('should fail when nullable is not a boolean', function () {
      (function () {
        new Model().nullable('false');
      }).should.throw();
    });
  });

  describe('#strict', function () {
    it('should set spec.strict', function () {
      var model = new Model({type: 'object', strict: false}).strict();
      model.spec.should.have.property('strict', true);
    });

    it('should set spec.strict', function () {
      var model = new Model({type: 'object', strict: true}).strict(false);
      model.spec.should.have.property('strict', false);
    });

    it('should fail when strict is not a boolean', function () {
      (function () {
        new Model().type('object').strict('false');
      }).should.throw();
    });
  });

  describe('#default', function () {
    it('should set spec.default', function () {
      var model = new Model().type('string').default('foobar');
      model.spec.should.have.property('default', 'foobar');
    });

    it('should set spec.default as array', function () {
      var arr = [1, 2, 3];
      var model = new Model().type('array').default(arr);
      model.spec.should.have.property('default', arr);
    });

    it('should unset spec.default', function () {
      var model = new Model({type: 'number', default: 1}).default();
      model.spec.should.have.property('default', undefined);
    });

    it('should fail when type is not set', function () {
      (function () {
        new Model().default('something');
      }).should.throw();
    });

    it('should fail when default is not the same type as model', function () {
      (function () {
        new Model().type('number').default('12');
      }).should.throw();
    });

    it('should fail when default is not array but type is', function () {
      (function () {
        new Model().type('array').default({'0': 1});
      }).should.throw();
    });
  });

  describe('#parse', function () {
    it('should set spec.parse', function () {
      var parse = function () {};
      var model = new Model().parse(parse);
      model.spec.should.have.property('parse', parse);
    });

    it('should fail when parse is not a function', function () {
      (function () {
        new Model().parse('false');
      }).should.throw();
    });
  });

  describe('#transform', function () {
    it('should set spec.transform', function () {
      var transform = function () {};
      var model = new Model().transform(transform);
      model.spec.should.have.property('transform', transform);
    });

    it('should fail when transform is not a function', function () {
      (function () {
        new Model().transform({});
      }).should.throw();
    });
  });

  describe('#options', function () {
    it('should set spec.options', function () {
      var model = new Model().type('string').options(['foo', 'bar']);
      model.spec.should.have.property('options').eql(['foo', 'bar']);
    });

    it('should fail when type is not set yet', function () {
      (function () {
        new Model().options(['foo']);
      }).should.throw();
    });

    it('should fail when type of option doesn\'t match type', function () {
      (function () {
        new Model().type('number').options([1, null]);
      }).should.throw();
    });
  });

  describe('#option', function () {
    it('should fail when type is not set yet', function () {
      (function () {
        new Model().option('foo');
      }).should.throw();
    });

    it('should fail when type of option doesn\'t match type', function () {
      (function () {
        new Model().type('number').option(null);
      }).should.throw();
    });

    context('when type is primitive', function () {
      it('should set spec.options first element', function () {
        var model = new Model().type('string').option('foo');
        model.spec.should.have.property('options').eql(['foo']);
      });

      it('should set spec.options second element', function () {
        var model = new Model().type('string').option('foo').option('bar');
        model.spec.should.have.property('options').eql(['foo', 'bar']);
      });

      it('should set spec.options first element as number', function () {
        var model = new Model().type('number').option(13);
        model.spec.should.have.property('options').eql([13]);
      });
    });

    context('when type is conditional', function () {
      it('should set spec.options first element with condition', function () {
        var sModel = new Model({type: 'string'});
        var sRef = new ValueRef('foobar');
        var sCondition = s => typeof s === 'string';
        var model = new Model().type('conditional').option(sModel, sRef, sCondition);
        model.spec.should.have.property('options').eql([{model: sModel, ref: sRef, condition: sCondition}]);
      });

      it('should set spec.options first element with string condition', function () {
        var sModel = new Model({type: 'string'});
        var model = new Model().type('conditional').option(sModel, 'path', 'value');
        model.spec.should.have.deep.property('options.0.model', sModel);
        model.spec.should.have.deep.property('options.0.ref.path', 'path');
        model.spec.should.have.deep.property('options.0.condition').is.a('function');
      });

      it('should set spec.options first element with array condition', function () {
        var sModel = new Model({type: 'string'});
        var model = new Model().type('conditional').option(sModel, ['path1', 'path2'], [0, 1]);
        model.spec.should.have.deep.property('options.0.model', sModel);
        model.spec.should.have.deep.property('options.0.ref.0.path', 'path1');
        model.spec.should.have.deep.property('options.0.ref.1.path', 'path2');
        model.spec.should.have.deep.property('options.0.condition').is.a('function');
      });

      it('should set spec.options first element without condition', function () {
        var sModel = new Model({type: 'string'});
        var model = new Model().type('conditional').option(sModel);
        model.spec.should.have.property('options').eql([{model: sModel}]);
      });

      it('should set spec.options second element without condition', function () {
        var sModel = new Model({type: 'string'});
        var iModel = new Model({type: 'number'});
        var iRef = new ValueRef('foobar');
        var iCondition = s => typeof s === 'number';
        var model = new Model().
          type('conditional').
          option(sModel).
          option(iModel, iRef, iCondition);
        model.spec.should.have.property('options').eql([
          {model: sModel},
          {model: iModel, ref: iRef, condition: iCondition}
        ]);
      });

      it('should fail when first argument is not model', function () {
        (function () {
          new Model().type('conditional').option('string');
        }).should.throw();
      });

      it('should fail when second argument is not a path', function () {
        (function () {
          new Model().type('conditional').option(new Model(), {}, _.noop);
        }).should.throw();
      });

      it('should fail when third argument is missing', function () {
        (function () {
          new Model().type('conditional').option(new Model(), 'path');
        }).should.throw();
      });
    });
  });

  describe('#children', function () {
    it('should set spec.children when object', function () {
      var childModel = {
        first: new Model({type: 'string'}),
        second: new Model({type: 'number'}),
      };

      var model = new Model().type('object').children(childModel);
      model.spec.should.have.property('children').eql([
        {name: 'first', model: childModel.first},
        {name: 'second', model: childModel.second},
      ]);
    });

    it('should set spec.children when array', function () {
      var childModel = new Model({type: 'string'});

      var model = new Model().type('array').children(childModel);
      model.spec.should.have.property('children').eql(childModel);
    });

    it('should fail when given undefined', function () {
      (function () {
        new Model().type('object').children();
      }).should.throw();
    });

    it('should fail when given a non-object', function () {
      (function () {
        new Model().type('object').children('something');
      }).should.throw();
    });

    it('should fail when set on a non-object Model', function () {
      (function () {
        new Model().type('string').children({});
      }).should.throw();
    });

    it('should fail when given a non-spec conforming object', function () {
      (function () {
        new Model().type('object').children({unknown: 'foobar'});
      }).should.throw();
    });

    it('should fail when type is object and is given a model', function () {
      (function () {
        new Model().type('object').children(new Model());
      }).should.throw();
    });
  });

  describe('#validations', function () {
    it('should set spec.validations when regex', function () {
      var regex = /^something|else$/;
      var model = new Model().type('string').validations([regex]);
      model.spec.should.have.property('validations').eql([regex]);
    });

    it('should set spec.validations when function', function () {
      var validate = function () { };
      var model = new Model().type('number').validations([validate]);
      model.spec.should.have.property('validations').eql([validate]);
    });

    it('should set spec.validations when array of functions', function () {
      var validateA = function () { };
      var validateB = function () { };
      var validate = [validateA, validateB];
      var model = new Model().validations(validate);
      model.spec.should.have.property('validations').eql(validate);
    });

    it('should fail when given a non-array', function () {
      (function () {
        new Model().validations('random');
      }).should.throw();
    });

    it('should fail when given a regexp and type is not string', function () {
      (function () {
        new Model().validations([/foo/]);
      }).should.throw();
    });

    it('should fail when given an array with invalid values', function () {
      (function () {
        new Model().validations([function () {}, 'other']);
      }).should.throw();
    });
  });

  describe('#validate', function () {
    it('should fail when type is not set', function () {
      (function () {
        new Model().validate('test');
      }).should.throw(/defined/);
    });

    it('should fail loudly when told to', function () {
      (function () {
        new Model({type: 'number'}).validate({}, true);
      }).should.throw();
    });

    context('when required', function () {
      it('should conform when present', function () {
        var model = new Model({type: 'string', required: true});
        model.validate('foobar').asObject().should.eql({
          conforms: true,
          value: 'foobar',
          errors: [],
        });
      });

      it('should conform when present', function () {
        var model = new Model({type: 'string', required: true});
        model.validate(null).asObject().should.eql({
          conforms: true,
          value: null,
          errors: [],
        });
      });

      it('should not conform when absent', function () {
        var model = new Model({type: 'string', required: true});
        model.validate(undefined).asObject().should.eql({
          conforms: false,
          errors: [{message: 'expected value to be defined'}],
        });
      });
    });

    context('when not nullable', function () {
      it('should not conform when null', function () {
        var model = new Model({type: 'string', nullable: false});
        model.validate(null).asObject().should.eql({
          conforms: false,
          value: null,
          errors: [{message: 'expected value to be non-null'}],
        });
      });

      it('should conform even when required', function () {
        var model = new Model({type: 'string', required: true, nullable: true});
        model.validate(null).asObject().should.eql({
          conforms: true,
          value: null,
          errors: [],
        });
      });
    });

    context('when default is set', function () {
      it('should fill in when undefined', function () {
        var model = new Model({type: 'string', default: 'hello world'});
        model.validate(undefined).asObject().should.eql({
          conforms: true,
          value: 'hello world',
          errors: [],
        });
      });

      it('should fill in when undefined and value is required', function () {
        var model = new Model({type: 'number', default: 123, required: true});
        model.validate(undefined).asObject().should.eql({
          conforms: true,
          value: 123,
          errors: [],
        });
      });

      it('should not fill in when null', function () {
        var model = new Model({type: 'string', default: 'hello world'});
        model.validate(null).asObject().should.eql({
          conforms: true,
          value: null,
          errors: [],
        });
      });

      it('should still validate', function () {
        var model = new Model({
          type: 'string',
          default: 'hello world',
          validations: [function () { assert.ok(false, 'oops'); }],
        });

        model.validate(undefined).asObject().should.eql({
          conforms: false,
          value: 'hello world',
          errors: [{message: 'oops'}],
        });
      });

      it('should still validate except when Nil', function () {
        var model = new Model({
          type: 'string',
          default: null,
          validations: [function () { assert.ok(false, 'oops'); }],
        });

        model.validate(undefined).asObject().should.eql({
          conforms: true,
          value: null,
          errors: [],
        });
      });
    });

    context('when parse is set', function () {
      it('should use parse before checking definedness', function () {
        var parser = function (value) { return 'something'; };
        var model = new Model({type: 'string', parse: parser, required: true});
        model.validate(undefined).asObject().should.eql({
          conforms: true,
          value: 'something',
          errors: [],
        });
      });

      it('should still check definedness', function () {
        var parser = function (value) { return; };
        var model = new Model({type: 'string', parse: parser, required: true});
        model.validate('something').asObject().should.eql({
          conforms: false,
          errors: [{message: 'expected value to be defined'}],
        });
      });

      it('should short-circuit when returning ValidationResult', function () {
        var parser = function (value) { return new ValidationResult('foo', true); };
        var validations = function () { assert.ok(false, 'yikes'); };
        var model = new Model({
          type: 'string',
          parse: parser,
          validations: [validations],
        });

        model.validate('something').asObject().should.eql({
          conforms: true,
          value: 'foo',
          errors: [],
        });
      });
    });

    context('when transform is set', function () {
      it('should transform the value', function () {
        var transform = function (value) { return Number(value); };
        var model = new Model({type: 'number', transform: transform});
        model.validate('123').asObject().should.eql({
          conforms: true,
          value: 123,
          errors: [],
        });
      });

      it('should short-circuit when returning failed validation result', function () {
        var transform = function (value) {
          return new ValidationResult(10, false, ['message']);
        };

        var model = new Model({type: 'number', transform: transform});
        model.validate('foo').asObject().should.eql({
          value: 10,
          conforms: false,
          errors: ['message'],
        });
      });

      it('should not short-circuit when returning successful validation result', function () {
        var transform = function (value) {
          return new ValidationResult(10, true);
        };

        var validate = function () {
          assert.ok(false, 'done');
        };

        var model = new Model({
          type: 'number',
          transform: transform,
          validations: [validate],
        });

        model.validate(123).asObject().should.eql({
          value: 10,
          conforms: false,
          errors: [{message: 'done'}],
        });
      });
    });

    context('when validations is a RegExp', function () {
      it('should pass a valid match', function () {
        var model = new Model({type: 'string', validations: [/^foo.*bar$/]});
        model.validate('fooANYTHINGbar').asObject().should.eql({
          value: 'fooANYTHINGbar',
          conforms: true,
          errors: [],
        });
      });

      it('should fail an invalid match', function () {
        var model = new Model({type: 'string', validations: [/^foo.*bar$/]});
        model.validate('somethingElsebar').asObject().should.eql({
          value: 'somethingElsebar',
          conforms: false,
          errors: [{message: 'expected somethingElsebar to match /^foo.*bar$/'}],
        });
      });

      it('should fail a non-string', function () {
        var model = new Model({type: 'string', validations: [/\d+/]});
        model.validate(12312).asObject().should.eql({
          value: 12312,
          conforms: false,
          errors: [{message: 'expected 12312 to have typeof string'}],
        });
      });
    });

    context('when validations is an array', function () {
      it('should pass a valid match', function () {
        var model = new Model({type: 'string', validations: [_.noop, _.noop]});
        model.validate('a string').asObject().should.eql({
          value: 'a string',
          conforms: true,
          errors: [],
        });
      });

      it('should fail when one element fails', function () {
        var fail = function () { assert.ok(false, 'oops'); };
        var model = new Model({type: 'number', validations: [_.noop, fail, _.noop]});
        model.validate(123).asObject().should.eql({
          value: 123,
          conforms: false,
          errors: [{message: 'oops'}],
        });
      });
    });

    context('when type is conditional', function () {
      var model, topLevelModel;

      beforeEach(function () {
        model = new Model({type: 'conditional'}).
          option(new Model({type: 'string'}), value => value === 'special').
          option(new Model({type: 'array'}), 'length', 5).
          option(new Model({type: 'boolean'}), 'id', value => value > 10).
          option(new Model({type: 'number'}), ['id', 'type'], [42, 'special']);

        topLevelModel = () => new Model({type: 'object'}).
          children({
            id: new Model({type: 'number'}),
            type: new Model({type: 'string'}),
            conditional: model,
          });
      });

      context('when no options apply', function () {
        it('should immediately conform when strict is false', function () {
          model.validate({}).asObject().should.eql({
            value: {},
            conforms: true,
            errors: [],
          });
        });

        it('should fail when strict is true', function () {
          model.strict().validate({}).asObject().should.eql({
            value: {},
            conforms: false,
            errors: [{message: 'no applicable models for strict conditional'}],
          });
        });
      });

      context('when a single option applies', function () {
        beforeEach(function () {
          model = model.strict();
        });

        it('should conform when simple model conforms', function () {
          model.validate('special').asObject().should.eql({
            value: 'special',
            conforms: true,
            errors: [],
          });
        });

        it('should conform when complex model conforms', function () {
          topLevelModel().validate({id: 12, conditional: 'true'}).asObject().should.eql({
            value: {id: 12, conditional: true},
            conforms: true,
            errors: [],
          });
        });

        it('should conform when complex refs conform', function () {
          topLevelModel().validate({
            id: 42, type: 'special',
            conditional: '500'
          }).asObject().should.eql({
            value: {id: 42, type: 'special', conditional: 500},
            conforms: true,
            errors: [],
          });
        });

        it('should fail when simple model fails', function () {
          model.validate('12345').asObject().should.eql({
            value: '12345',
            conforms: false,
            errors: [{message: 'expected "12345" to have typeof array'}],
          });
        });

        it('should fail when complex model fails', function () {
          topLevelModel().validate({id: 12, conditional: 1234}).asObject().should.eql({
            value: {id: 12, conditional: 1234},
            conforms: false,
            errors: [
              {path: 'conditional', message: 'expected 1234 to have typeof boolean'},
            ],
          });
        });
      });

      context('when multiple options apply', function () {
        beforeEach(function () {
          model = new Model({type: 'conditional'}).
            option(new Model({type: 'number'})).
            option(new Model({type: 'boolean'})).
            option(new Model({type: 'string'})).
            option(new Model({type: 'array'}), 'id', 15);
        });

        it('should pass when the first option passes', function () {
          model.validate('1234').asObject().should.eql({
            value: 1234,
            conforms: true,
            errors: [],
          });
        });

        it('should pass when the second option passes', function () {
          model.validate('false').asObject().should.eql({
            value: false,
            conforms: true,
            errors: [],
          });
        });

        it('should pass when the third option passes', function () {
          model.validate('foobar').asObject().should.eql({
            value: 'foobar',
            conforms: true,
            errors: [],
          });
        });

        it('should fail when no option passes', function () {
          topLevelModel().validate({id: 1, conditional: []}).asObject().should.eql({
            value: {id: 1, conditional: []},
            conforms: false,
            errors: [
              {path: 'conditional', message: 'expected [] to have typeof number'},
              {path: 'conditional', message: 'expected [] to have typeof boolean'},
              {path: 'conditional', message: 'expected [] to have typeof string'},
            ],
          });
        });
      });
    });
  });
});
