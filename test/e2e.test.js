var _ = require('lodash');
var klay = relativeRequire('klay.js');

describe('klay', function () {
  context('fixtures/document.js', function () {
    var fixture = require('./fixtures/document.js');
    var model;

    beforeEach(function () {
      model = fixture(klay());
    });

    afterEach(function () {
      klay.reset();
    });

    it('should pass valid html document', function () {
      var obj = {
        id: '12345678-1234-1234-1234-123412341234',
        parentId: '12345678-1234-1234-1234-123412341234',
        type: 'html',
        metadata: {title: 'my document', version: 'html5'},
        source: {raw: '<html></html>', text: ''},
        createdAt: '2016-07-27T04:51:22.820Z',
        updatedAt: '2016-07-27T04:51:22.820Z',
      };

      var validated = model.validate(obj);
      validated.should.have.property('conforms', true);
      validated.should.have.property('value').eql(_.defaults({
        createdAt: new Date('2016-07-27T04:51:22.820Z'),
        updatedAt: new Date('2016-07-27T04:51:22.820Z'),
      }, obj));
    });

    it('should pass valid json document', function () {
      var obj = {
        id: '12345678-1234-1234-1234-123412341234',
        parentId: '12345678-1234-1234-1234-123412341234',
        type: 'json',
        metadata: {type: 'array', size: '120'},
        source: {prop1: 'foobar', prop2: 'something'},
        createdAt: '2016-07-27T04:51:22.820Z',
        updatedAt: '2016-07-27T04:51:22.820Z',
      };

      var validated = model.validate(obj);
      validated.should.have.property('conforms', true);
      validated.should.have.property('value').eql(_.defaults({
        metadata: {type: 'array', size: 120},
        createdAt: new Date('2016-07-27T04:51:22.820Z'),
        updatedAt: new Date('2016-07-27T04:51:22.820Z'),
      }, obj));
    });

    it('should fail invalid html document', function () {
      var obj = {
        id: '12345678-1234-1234-1234-123412341234',
        parentId: '12345678-1234-1234-1234-123412341234',
        type: 'html',
        metadata: {title: 'foo', version: 'v1', html5: true},
        source: {raw: '2short'},
        createdAt: '2016-07-27T04:51:22.820Z',
        updatedAt: '2016-07-27T04:51:22.820Z',
      };

      var validated = model.validate(obj);
      validated.should.have.property('conforms', false);
      validated.should.have.property('errors').eql([
        {message: 'unexpected properties: html5', path: 'metadata'},
        {message: 'value must have length greater than or equal to 8', path: 'source.raw'},
        {message: 'expected value to be defined', path: 'source.text'},
      ]);

      validated.should.have.property('value').eql(_.defaults({
        source: {raw: '2short', text: undefined},
        createdAt: new Date('2016-07-27T04:51:22.820Z'),
        updatedAt: new Date('2016-07-27T04:51:22.820Z'),
      }, obj));
    });

    it('should fail invalid json document', function () {
      var obj = {
        id: '12345678-1234-1234-1234-123412341234',
        parentId: '12345678-1234-1234-1234-123412341234',
        type: 'json',
        metadata: {type: 'number', size: 'fifty'},
        source: {a: 1, b: true, c: 'foo'},
        createdAt: '2016-07-27T04:51:22.820Z',
        updatedAt: '2016-07-27T04:51:22.820Z',
      };

      var validated = model.validate(obj);
      validated.should.have.property('conforms', false);
      validated.should.have.property('errors').eql([
        {message: 'expected number to be one of ["object","array"]', path: 'metadata.type'},
        {message: 'value must be an integer', path: 'metadata.size'},
      ]);

      validated.should.have.property('value').eql(_.defaults({
        createdAt: new Date('2016-07-27T04:51:22.820Z'),
        updatedAt: new Date('2016-07-27T04:51:22.820Z'),
      }, obj));
    });
  });
});
