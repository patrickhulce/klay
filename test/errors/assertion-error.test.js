const expect = require('chai').expect
const AssertionError = require('../../lib-ts/errors/assertion-error').AssertionError

describe('errors/assertion-error.ts', () => {
  describe('#constructor', () => {
    it('should construct an error', () => {
      const error = new AssertionError('expected something to be true')
      expect(error.stack).to.match(/assertion-error.test.js/)
    })
  })

  describe('#ok', () => {
    it('should throw on falsey', () => {
      expect(() => AssertionError.ok(false)).to.throw(/expected value/)
      expect(() => AssertionError.ok(0, 'wha the')).to.throw(/wha the/)
    })

    it('should pass on truthy', () => {
      expect(() => AssertionError.ok(true)).to.not.throw()
      expect(() => AssertionError.ok('yo')).to.not.throw()
    })
  })

  describe('#typeof', () => {
    it('should throw on failed typeofs', () => {
      expect(() => AssertionError.typeof(false, 'number')).to.throw()
      expect(() => AssertionError.typeof('', 'number')).to.throw()
      expect(() => AssertionError.typeof(123, 'string')).to.throw()
      expect(() => AssertionError.typeof(null, 'array')).to.throw()
    })

    it('should pass on true typeofs', () => {
      expect(() => AssertionError.typeof(1, 'number')).to.not.throw()
      expect(() => AssertionError.typeof(true, 'boolean')).to.not.throw()
      expect(() => AssertionError.typeof('123', 'string')).to.not.throw()
      expect(() => AssertionError.typeof([1, 2], 'array')).to.not.throw()
      expect(() => AssertionError.typeof(null, 'object')).to.not.throw()
    })
  })

  describe('#getRepresentation', () => {
    const getRepresentation = AssertionError.getRepresentation

    it('should convert simple types to string', () => {
      expect(getRepresentation(undefined)).to.equal('undefined')
      expect(getRepresentation(null)).to.equal('null')
      expect(getRepresentation(false)).to.equal('false')
      expect(getRepresentation(123)).to.equal('123')
      expect(getRepresentation('foo')).to.equal('foo')
    })

    it('should convert objects to string', () => {
      expect(getRepresentation({foo: 'bar'})).to.equal('{foo: bar}')
      expect(getRepresentation({foo: 1, bar: 2})).to.equal('{foo: 1, bar: 2}')
      expect(getRepresentation({foo: [1, 2, 3]})).to.equal('{foo: [1, 2, ...]}')
      expect(getRepresentation({foo: [1, 2, 3, 4]}, 10)).to.equal('{foo: [1, 2, 3, 4]}')
    })

    it('should convert arrays to string', () => {
      expect(getRepresentation([1, 2, 3])).to.equal('[1, 2, 3]')
      expect(getRepresentation(['a', 'b', null, 'c'])).to.equal('[a, b, null, ...]')
      expect(getRepresentation([1, 2, 3, 4, 5], 10)).to.equal('[1, 2, 3, 4, 5]')
    })
  })
})
