var _ = require('lodash');
var should = require('chai').should();
var Model = relativeRequire('Model.js');

defineTest('extensions/date.js', function (dateFactory) {
  var extension = dateFactory(spec => new Model(spec));

  describe('#builders', function () {
    beforeEach(function () {
      Model.types = ['date'];
      Model.formats.date = ['unix'];
    });

    afterEach(function () {
      Model.reset();
    });

    var builders = extension.builders;
    describe('date', function () {
      it('should create a model with type date', function () {
        var model = builders.date();
        model.should.have.deep.property('spec.type', 'date');
      });
    });

    describe('unix', function () {
      it('should create a model with type date and format unix', function () {
        var model = builders.unixtimestamp();
        model.should.have.deep.property('spec.type', 'date');
        model.should.have.deep.property('spec.format', 'unix');
      });
    });
  });

  describe('#transformations', function () {
    describe('unix', function () {
      var transform = extension.transformations.date.unix;

      it('should transform string values', function () {
        transform('86400').should.eql(new Date('1970-01-02T00:00:00.000Z'));
        transform(String(86400 * 366)).should.eql(new Date('1971-01-02T00:00:00.000Z'));
      });

      it('should transform number values', function () {
        transform(86400).should.eql(new Date('1970-01-02T00:00:00.000Z'));
        transform(86400 * 366).should.eql(new Date('1971-01-02T00:00:00.000Z'));
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

    describe('__default', function () {
      var transform = extension.transformations.date.__default;

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
  });

  describe('#validations', function () {
    describe('__default', function () {
      var validate = extension.validations.date.__default;
      it('should pass valid date values', function () {
        (function () {
          validate(new Date());
          validate(new Date('2016-01-02'));
        }).should.not.throw();
      });

      it('should fail invalid values', function () {
        [
          () => validate(null),
          () => validate(undefined),
          () => validate(false),
          () => validate(1231235),
          () => validate('2016-01-12'),
          () => validate(new Date('unknown')),
        ].forEach(f => f.should.throw());
      });
    });
  });
});
