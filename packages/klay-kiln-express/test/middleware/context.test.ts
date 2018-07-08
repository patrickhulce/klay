const URL = require('url').URL
const middlewareModule = require('../../lib/middleware/context')

describe('lib/middleware/context.ts', () => {
  describe('#createAddFullURLMiddleware', () => {
    let req, next, getHeader
    const createMiddleware = middlewareModule.createAddFullURLMiddleware

    beforeEach(() => {
      next = jest.fn()
      getHeader = jest.fn()
      req = {get: getHeader, originalUrl: ''}
    })

    it('should set parsedURL', () => {
      const handler = createMiddleware()
      getHeader.mockReturnValue('example.com')
      req.originalUrl = '/v1/foo_other.php?q=1&a=2#about'
      handler(req, {}, next)
      expect(req.parsedURL).toBeInstanceOf(URL)
      expect(req.parsedURL.href).toEqual('http://example.com/v1/foo_other.php?q=1&a=2#about')
      expect(next).toHaveBeenCalled()
    })

    it('should set parsedURL when https', () => {
      const handler = createMiddleware()
      req.protocol = 'https'
      getHeader.mockReturnValue('example.com')
      handler(req, {}, next)
      expect(req.parsedURL).toBeInstanceOf(URL)
      expect(req.parsedURL.href).toEqual('https://example.com/')
    })

    it('should set parsedURL when behind proxy', () => {
      const handler = createMiddleware()
      req.protocol = 'http'
      getHeader.mockImplementation(name => {
        if (name === 'host') {
          return 'nonsense.com'
        }
        if (name === 'x-forwarded-host') {
          return 'example.com'
        }
        return 'on'
      })
      handler(req, {}, next)
      expect(req.parsedURL).toBeInstanceOf(URL)
      expect(req.parsedURL.href).toEqual('https://example.com/')
    })

    it('should default host', () => {
      const handler = createMiddleware()
      handler(req, {}, next)
      expect(req.parsedURL).toBeInstanceOf(URL)
      expect(req.parsedURL.href).toEqual('http://unknown/')
    })
  })
})
