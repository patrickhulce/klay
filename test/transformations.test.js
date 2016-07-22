var _ = require('lodash');
var assert = require('assert');
var should = require('chai').should();
var Model = relativeRequire('Model');

defineTest('transformations.js', function (transformations) {
  describe('#boolean', function () {
    var transform = transformations.boolean.__default;

    it('should transform string values', function () {
      transform('true').should.equal(true);
      transform('false').should.equal(false);
    });

    it('should directly return a boolean value', function () {
      transform(true).should.equal(true);
      transform(false).should.equal(false);
    });

    it('should directly return all other values', function () {
      var obj = {};
      var arr = [];

      transform(0).should.equal(0);
      transform(obj).should.equal(obj);
      transform(arr).should.equal(arr);
      should.equal(transform(null), null);
      should.equal(transform(undefined), undefined);
    });
  });

  describe('#number', function () {
    var transform = transformations.number.__default;

    it('should transform valid string values', function () {
      transform('123').should.equal(123);
      transform('12.54').should.equal(12.54);
    });

    it('should directly return an invalid string value', function () {
      transform('').should.equal('');
      transform('two').should.equal('two');
      transform('foobar').should.equal('foobar');
    });

    it('should directly return all other values', function () {
      var obj = {};
      var arr = [];

      transform(obj).should.equal(obj);
      transform(arr).should.equal(arr);
      should.equal(transform(null), null);
      should.equal(transform(undefined), undefined);
    });
  });

  describe('#date', function () {
    var transform = transformations.date.__default;

    it('should transform string values', function () {
      transform('2016-01-04').should.eql(new Date('2016-01-04T00:00:00.000Z'));
      transform('1993-02-14T08:00:00.000Z').should.eql(new Date('1993-02-14T08:00:00.000Z'));
    });

    it('should transform number values', function () {
      transform(86400 * 1000).should.eql(new Date('1970-01-02T00:00:00.000Z'));
      transform(86400 * 366 * 1000).should.eql(new Date('1971-01-02T00:00:00.000Z'));
    });

    it('should directly return a date value', function () {
      var d1 = new Date(2016, 04, 03);
      var d2 = new Date(1985, 02, 01);
      transform(d1).should.equal(d1);
      transform(d2).should.equal(d2);
    });

    it('should directly return all other values', function () {
      var obj = {};
      var arr = [];

      transform('foobar').should.equal('foobar');
      transform(obj).should.equal(obj);
      transform(arr).should.equal(arr);
      should.equal(transform(null), null);
      should.equal(transform(undefined), undefined);
    });
  });

  describe('#object', function () {
    var transform = transformations.object.__default;

    it('should directly return values when children is not set', function () {
      var arr = [];
      var obj = {property: 1};
      var model = new Model({type: 'object'});

      transform.call(model, 123).should.equal(123);
      transform.call(model, arr).should.equal(arr);
      transform.call(model, obj).should.equal(obj);
      transform.call(model, 'foobar').should.equal('foobar');
      should.equal(transform.call(model, undefined), undefined);
    });

    it('should fail when value is not an object', function () {
      (function () {
        var child = {foo: {}};
        var model = new Model({type: 'object', children: child});

        transform.call(model, 'foobar');
      }).should.throw(assert.AssertionError);
    });

    context('when validating children', function () {
      var children, model;

      beforeEach(function () {
        children = {
          id: new Model({type: 'number'}),
          name: new Model({type: 'string', validations: /^ABC/}),
          isAdmin: new Model({type: 'boolean'}),
        };

        model = new Model({
          type: 'object',
          children: children,
        });
      });

      it('should succeed', function () {
        transform.call(model, {
          id: 123,
          name: 'ABC4ME',
          isAdmin: true,
        }).asObject().should.eql({
          conforms: true,
          errors: [],
          value: {
            id: 123,
            name: 'ABC4ME',
            isAdmin: true,
          },
        });
      });

      it('should transform children', function () {
        transform.call(model, {
          id: '1234',
          name: 'ABC4ME',
          isAdmin: 'false',
        }).asObject().should.eql({
          conforms: true,
          errors: [],
          value: {
            id: 1234,
            name: 'ABC4ME',
            isAdmin: false,
          },
        });
      });

      it('should fail when a child fails', function () {
        transform.call(model, {
          id: '1234',
          name: 'nonconform',
          isAdmin: 'false',
        }).asObject().should.eql({
          conforms: false,
          errors: [{path: 'name', message: 'expected nonconform to match /^ABC/'}],
          value: {
            id: 1234,
            name: 'nonconform',
            isAdmin: false,
          },
        });
      });

      it('should fail when multiple children fail', function () {
        transform.call(model, {
          id: 'id',
          name: 'nonconform',
          isAdmin: 'false',
        }).asObject().should.eql({
          conforms: false,
          errors: [
            {path: 'id', message: 'expected "id" to have typeof number'},
            {path: 'name', message: 'expected nonconform to match /^ABC/'},
          ],
          value: {
            id: 'id',
            name: 'nonconform',
            isAdmin: false,
          },
        });
      });
    });

    context('when validating nested children', function () {
      var model;

      beforeEach(function () {
        var nestedObject = new Model({
          type: 'object',
          children: {type: new Model({type: 'number'})}
        });

        var nestedConditional = new Model({type: 'conditional'}).
          option(new Model({type: 'number'}), 'source.type', 2).
          option(new Model({type: 'boolean'}), 'source.type', 3);

        var children = {
          id: new Model({type: 'number'}),
          meta: nestedConditional,
          name: new Model({type: 'string'}),
          source: nestedObject,
        };

        model = new Model({type: 'object', children: children});
      });

      it('should succeed', function () {
        transform.call(model, {
          id: 123,
          name: 'cool name',
          source: {type: 2},
          meta: 123,
        }).asObject().should.eql({
          conforms: true,
          errors: [],
          value: {
            id: 123,
            name: 'cool name',
            source: {type: 2},
            meta: 123,
          },
        });
      });

      it('should transform children', function () {
        transform.call(model, {
          id: 123,
          name: 'cool name',
          source: {type: '3'},
          meta: 'true',
        }).asObject().should.eql({
          conforms: true,
          errors: [],
          value: {
            id: 123,
            name: 'cool name',
            source: {type: 3},
            meta: true,
          },
        });
      });

      it('should not fail when children are missing', function () {
        transform.call(model, {
          id: 123,
          name: 'still works',
        }).asObject().should.eql({
          conforms: true,
          errors: [],
          value: {
            id: 123,
            name: 'still works',
          },
        });
      });

      it('should fail when children fail', function () {
        transform.call(model, {
          id: 123,
          name: 'other name',
          source: {type: 'other'},
          meta: 'true',
        }).asObject().should.eql({
          conforms: false,
          errors: [{path: 'source.type', message: 'expected "other" to have typeof number'}],
          value: {
            id: 123,
            name: 'other name',
            source: {type: 'other'},
            meta: 'true',
          },
        });
      });
    });
  });

  describe('#array', function () {
    var transform = transformations.array.__default;

    it('should directly return values when children is not set', function () {
      var arr = [];
      var obj = {property: 1};
      var model = new Model({type: 'array'});

      transform.call(model, 123).should.equal(123);
      transform.call(model, arr).should.equal(arr);
      transform.call(model, obj).should.equal(obj);
      transform.call(model, 'foobar').should.equal('foobar');
      should.equal(transform.call(model, undefined), undefined);
    });

    it('should fail when value is not an array', function () {
      (function () {
        var childModel = new Model({type: 'number'});
        var model = new Model({type: 'object', children: childModel});

        transform.call(model, 'foobar');
      }).should.throw(assert.AssertionError);
    });

    context('when validating children', function () {
      var children, model;

      beforeEach(function () {
        model = new Model({
          type: 'array',
          children: new Model({type: 'number'}),
        });
      });

      it('should succeed', function () {
        transform.call(model, [123]).asObject().should.eql({
          conforms: true,
          errors: [],
          value: [123],
        });
      });

      it('should transform children', function () {
        transform.call(model, ['123']).asObject().should.eql({
          conforms: true,
          errors: [],
          value: [123],
        });
      });

      it('should fail when a child fails', function () {
        transform.call(model, [1, 'foo', 2]).asObject().should.eql({
          conforms: false,
          errors: [{path: '1', message: 'expected "foo" to have typeof number'}],
          value: [1, 'foo', 2],
        });
      });

      it('should fail when multiple children fail', function () {
        transform.call(model, [1, 'foo', 'bar']).asObject().should.eql({
          conforms: false,
          errors: [
            {path: '1', message: 'expected "foo" to have typeof number'},
            {path: '2', message: 'expected "bar" to have typeof number'},
          ],
          value: [1, 'foo', 'bar'],
        });
      });
    });
  });
});
