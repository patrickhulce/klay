var _ = require('lodash');
var assert = require('assert');
var should = require('chai').should();
var Model = relativeRequire('Model');

defineTest('validations.js', function (validations) {
  var mapIntoFunctions = function (values, validate, model) {
    return values.map(value => () => validate.call(model, value));
  };

  var testPassingValues = function () {
    mapIntoFunctions.apply(null, arguments).forEach(f => f.should.not.throw());
  };

  var testFailingValues = function () {
    mapIntoFunctions.apply(null, arguments).forEach(f => f.should.throw());
  };

  describe('#undefined', function () {
    var validate = validations.undefined.__default;

    it('should pass when undefined', function () {
      testPassingValues([undefined], validate);
    });

    it('should fail when not undefined', function () {
      testFailingValues([null, false, 1, 'foo', {}, [], new Date()], validate);
    });
  });

  describe('#boolean', function () {
    var validate = validations.boolean.__default;

    it('should pass when boolean', function () {
      testPassingValues([true, false], validate);
    });

    it('should fail when not boolean', function () {
      testFailingValues([null, 0, 'true', {}, []], validate);
    });
  });

  describe('#number', function () {
    var validate = validations.number.__default;

    it('should pass when number', function () {
      testPassingValues([0, 1.232, 1253252, -9988723], validate);
    });

    it('should fail when not number', function () {
      testFailingValues([null, true, '', 'true', new Date()], validate);
    });

    it('should respect options', function () {
      var model = new Model({type: 'number', options: [1, 15, 56]});
      testPassingValues([1, 15, 56], validate, model);
      testFailingValues([23, 53, 'other'], validate, model);
    });
  });

  describe('#string', function () {
    var validate = validations.string.__default;

    it('should pass when string', function () {
      testPassingValues(['', 'foo', 'something long', '123'], validate);
    });

    it('should fail when not string', function () {
      testFailingValues([null, true, 12, 0, {}, new Date()], validate);
    });

    it('should respect options', function () {
      var model = new Model({type: 'string', options: ['blue', 'red', 'yellow']});
      testPassingValues(['blue', 'red', 'yellow'], validate, model);
      testFailingValues(['green', 'purple', 76, {}], validate, model);
    });
  });

  describe('#object', function () {
    var validate = validations.object.__default;

    context('when not strict', function () {
      var model;
      beforeEach(function () {
        model = new Model({type: 'object'});
      });

      it('should pass when object', function () {
        testPassingValues([new Date(), {foo: 'bar'}, null, []], validate, model);
      });

      it('should fail when not object', function () {
        testFailingValues([true, 12, '2011-01-01'], validate, model);
      });
    });

    context('when strict', function () {
      var model;
      beforeEach(function () {
        model = new Model({
          type: 'object',
          strict: true,
          children: {id: new Model({type: 'number'})}
        });
      });

      it('should pass when object', function () {
        testPassingValues([{}, {id: 1}], validate, model);
      });

      it('should fail when not object', function () {
        testFailingValues([true, 12, '2011-01-01'], validate, model);
      });

      it('should fail when object has unknown keys', function () {
        testFailingValues([[1], {foo: 1}, {id: 1, other: ''}], validate, model);
      });
    });
  });

  describe('#array', function () {
    var validate = validations.array.__default;

    it('should pass when array', function () {
      testPassingValues([[], [1, 2, 3]], validate);
    });

    it('should fail when not array', function () {
      testFailingValues([null, true, 1, 'array', {'0': 1, '1': 2}], validate);
    });
  });

});
