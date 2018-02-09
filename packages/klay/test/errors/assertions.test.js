const expect = require('chai').expect
const Assertions = require('../../lib/errors/assertions').Assertions

describe('errors/assertions.ts', () => {
  const assertions = new Assertions(msg => new Error(msg))

  describe('#constructor', () => {
    it('should construct an assertions', () => {
      const assertions = new Assertions(msg => new Error(msg))
      expect(() => assertions.ok(false)).to.throw(Error)
    })

    it('should use createError function', () => {
      const assertions = new Assertions(msg => new TypeError(msg))
      expect(() => assertions.ok(false)).to.throw(TypeError)
    })
  })

  describe('.ok', () => {
    it('should throw on falsey', () => {
      expect(() => assertions.ok(false)).to.throw(/expected value/)
      expect(() => assertions.ok(0, 'wha the')).to.throw(/wha the/)
    })

    it('should pass on truthy', () => {
      expect(() => assertions.ok(true)).to.not.throw()
      expect(() => assertions.ok('yo')).to.not.throw()
    })
  })

  describe('.typeof', () => {
    it('should throw on failed typeofs', () => {
      expect(() => assertions.typeof(false, 'number')).to.throw()
      expect(() => assertions.typeof('', 'number')).to.throw()
      expect(() => assertions.typeof(123, 'string')).to.throw()
      expect(() => assertions.typeof(null, 'array')).to.throw()
    })

    it('should pass on true typeofs', () => {
      expect(() => assertions.typeof(1, 'number')).to.not.throw()
      expect(() => assertions.typeof(true, 'boolean')).to.not.throw()
      expect(() => assertions.typeof('123', 'string')).to.not.throw()
      expect(() => assertions.typeof([1, 2], 'array')).to.not.throw()
      expect(() => assertions.typeof(null, 'object')).to.not.throw()
    })
  })

  describe('.match', () => {
    it('should throw on failed match', () => {
      expect(() => assertions.match(false, /foo/)).to.throw()
      expect(() => assertions.match('bar', /foo/)).to.throw()
      expect(() => assertions.match({}, /foo/)).to.throw()
      expect(() => assertions.match('', /foo/)).to.throw()
    })

    it('should pass on true matches', () => {
      expect(() => assertions.match('foo', /foo/)).to.not.throw()
      expect(() => assertions.match('123foo123', /foo/)).to.not.throw()
      expect(() => assertions.match('other Thing', /her/)).to.not.throw()
    })
  })

  describe('#getRepresentation', () => {
    const getRepresentation = Assertions.getRepresentation

    it('should convert simple types to string', () => {
      expect(getRepresentation(undefined)).to.equal('undefined')
      expect(getRepresentation(null)).to.equal('null')
      expect(getRepresentation(false)).to.equal('false')
      expect(getRepresentation(123)).to.equal('123')
      expect(getRepresentation('foo')).to.equal('foo')
      expect(getRepresentation(/^foobar$/)).to.equal('/^foobar$/')
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
