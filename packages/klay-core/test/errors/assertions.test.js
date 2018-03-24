const Assertions = require('../../dist/errors/assertions').Assertions

describe('lib/errors/assertions.ts', () => {
  const assertions = new Assertions(msg => new Error(msg))

  describe('#constructor', () => {
    it('should construct an assertions', () => {
      const assertions = new Assertions(msg => new Error(msg))
      expect(() => assertions.ok(false)).toThrowError(Error)
    })

    it('should use createError function', () => {
      const assertions = new Assertions(msg => new TypeError(msg))
      expect(() => assertions.ok(false)).toThrowError(TypeError)
    })
  })

  describe('.ok', () => {
    it('should throw on falsey', () => {
      expect(() => assertions.ok(false)).toThrowError(/expected value/)
      expect(() => assertions.ok(0, 'wha the')).toThrowError(/wha the/)
    })

    it('should pass on truthy', () => {
      expect(() => assertions.ok(true)).not.toThrowError()
      expect(() => assertions.ok('yo')).not.toThrowError()
    })
  })

  describe('.typeof', () => {
    it('should throw on failed typeofs', () => {
      expect(() => assertions.typeof(false, 'number')).toThrowError()
      expect(() => assertions.typeof('', 'number')).toThrowError()
      expect(() => assertions.typeof(123, 'string')).toThrowError()
      expect(() => assertions.typeof(null, 'array')).toThrowError()
    })

    it('should pass on true typeofs', () => {
      expect(() => assertions.typeof(1, 'number')).not.toThrowError()
      expect(() => assertions.typeof(true, 'boolean')).not.toThrowError()
      expect(() => assertions.typeof('123', 'string')).not.toThrowError()
      expect(() => assertions.typeof([1, 2], 'array')).not.toThrowError()
      expect(() => assertions.typeof(null, 'object')).not.toThrowError()
    })
  })

  describe('.match', () => {
    it('should throw on failed match', () => {
      expect(() => assertions.match(false, /foo/)).toThrowError()
      expect(() => assertions.match('bar', /foo/)).toThrowError()
      expect(() => assertions.match({}, /foo/)).toThrowError()
      expect(() => assertions.match('', /foo/)).toThrowError()
    })

    it('should pass on true matches', () => {
      expect(() => assertions.match('foo', /foo/)).not.toThrowError()
      expect(() => assertions.match('123foo123', /foo/)).not.toThrowError()
      expect(() => assertions.match('other Thing', /her/)).not.toThrowError()
    })
  })

  describe('#getRepresentation', () => {
    const getRepresentation = Assertions.getRepresentation

    it('should convert simple types to string', () => {
      expect(getRepresentation(undefined)).toEqual('undefined')
      expect(getRepresentation(null)).toEqual('null')
      expect(getRepresentation(false)).toEqual('false')
      expect(getRepresentation(123)).toEqual('123')
      expect(getRepresentation('foo')).toEqual('foo')
      expect(getRepresentation(/^foobar$/)).toEqual('/^foobar$/')
    })

    it('should convert objects to string', () => {
      expect(getRepresentation({foo: 'bar'})).toEqual('{foo: bar}')
      expect(getRepresentation({foo: 1, bar: 2})).toEqual('{foo: 1, bar: 2}')
      expect(getRepresentation({foo: [1, 2, 3]})).toEqual('{foo: [1, 2, ...]}')
      expect(getRepresentation({foo: [1, 2, 3, 4]}, 10)).toEqual('{foo: [1, 2, 3, 4]}')
    })

    it('should convert arrays to string', () => {
      expect(getRepresentation([1, 2, 3])).toEqual('[1, 2, 3]')
      expect(getRepresentation(['a', 'b', null, 'c'])).toEqual('[a, b, null, ...]')
      expect(getRepresentation([1, 2, 3, 4, 5], 10)).toEqual('[1, 2, 3, 4, 5]')
    })
  })
})
