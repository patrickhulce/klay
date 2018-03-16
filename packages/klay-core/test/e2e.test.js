const expect = require('chai').expect
const klay = require('../dist').defaultModelContext
const documentModel = require('./fixtures/document')

describe('klay', () => {
  context('simple object', () => {
    const model = klay
      .object()
      .children({
        firstName: klay.string().required(),
        lastName: klay.string().required(),
        email: klay.email().required(),
        age: klay.integer(),
      })
      .strict()

    it('should validate', () => {
      const value = {
        firstName: 'John',
        lastName: 42,
        email: 'invalid.com',
        age: 'eleven',
      }

      const result = model.validate(value).toJSON()
      expect(result).to.deep.include({
        conforms: false,
        value: {
          firstName: 'John',
          lastName: '42',
          email: 'invalid.com',
          age: 'eleven',
        },
        errors: [
          {message: 'expected value (invalid.com) to be email', path: ['email']},
          {message: 'expected value (eleven) to have typeof number', path: ['age']},
        ],
      })
    })
  })

  context('fixtures/document.js', () => {
    const model = documentModel

    it('should pass valid html document', () => {
      const obj = {
        id: '12345678-1234-1234-1234-123412341234',
        parentId: '12345678-1234-1234-1234-123412341234',
        type: 'html',
        metadata: {title: 'my document', version: 'html5'},
        source: {raw: '<html></html>', text: ''},
        createdAt: '2016-07-27T04:51:22.820Z',
        updatedAt: '2016-07-27T04:51:22.820Z',
      }

      const validated = model.validate(obj).toJSON()
      expect(validated).to.have.property('conforms', true)
      expect(validated)
        .to.have.property('value')
        .eql({
          ...obj,
          createdAt: new Date('2016-07-27T04:51:22.820Z'),
          updatedAt: new Date('2016-07-27T04:51:22.820Z'),
        })
    })

    it('should pass valid json document', () => {
      const obj = {
        id: '12345678-1234-1234-1234-123412341234',
        parentId: '12345678-1234-1234-1234-123412341234',
        type: 'json',
        metadata: {type: 'array', size: '120'},
        source: {prop1: 'foobar', prop2: 'something'},
        createdAt: '2016-07-27T04:51:22.820Z',
        updatedAt: '2016-07-27T04:51:22.820Z',
      }

      const validated = model.validate(obj).toJSON()
      expect(validated).to.have.property('conforms', true)
      expect(validated)
        .to.have.property('value')
        .eql({
          ...obj,
          metadata: {type: 'array', size: 120},
          createdAt: new Date('2016-07-27T04:51:22.820Z'),
          updatedAt: new Date('2016-07-27T04:51:22.820Z'),
        })
    })

    it('should fail invalid html document', () => {
      const obj = {
        id: '12345678-1234-1234-1234-123412341234',
        parentId: '12345678-1234-1234-1234-123412341234',
        type: 'html',
        metadata: {title: 'foo', version: 'v1', html5: true},
        source: {raw: '2short'},
        createdAt: '2016-07-27T04:51:22.820Z',
        updatedAt: '2016-07-27T04:51:22.820Z',
      }

      const validated = model.validate(obj).toJSON()
      expect(validated).to.have.property('conforms', false)
      expect(validated)
        .to.have.property('errors')
        .eql([
          {message: 'unexpected properties: html5', path: ['metadata']},
          {message: 'expected value to be at least 8', path: ['source', 'raw']},
          {message: 'expected value to be defined', path: ['source', 'text']},
        ])

      expect(validated)
        .to.have.property('value')
        .eql({
          ...obj,
          source: {raw: '2short', text: undefined},
          createdAt: new Date('2016-07-27T04:51:22.820Z'),
          updatedAt: new Date('2016-07-27T04:51:22.820Z'),
        })
    })

    it('should fail invalid json document', () => {
      const obj = {
        id: '12345678-1234-1234-1234-123412341234',
        parentId: '12345678-1234-1234-1234-123412341234',
        type: 'json',
        metadata: {type: 'number', size: 'fifty'},
        source: {a: 1, b: true, c: 'foo'},
        createdAt: '2016-07-27T04:51:22.820Z',
        updatedAt: '2016-07-27T04:51:22.820Z',
      }

      const validated = model.validate(obj).toJSON()
      expect(validated).to.have.property('conforms', false)
      expect(validated)
        .to.have.property('errors')
        .eql([
          {
            message: 'expected value (number) to be one of [object, array]',
            path: ['metadata', 'type'],
          },
          {message: 'expected value (fifty) to have typeof number', path: ['metadata', 'size']},
        ])

      expect(validated)
        .to.have.property('value')
        .eql({
          ...obj,
          createdAt: new Date('2016-07-27T04:51:22.820Z'),
          updatedAt: new Date('2016-07-27T04:51:22.820Z'),
        })
    })
  })
})
