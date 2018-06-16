const AssertionError = require('klay-core').AssertionError
const handlers = require('../../lib/middleware/handlers')

describe('lib/middleware/handlers.ts', () => {
  let req, res, next

  beforeEach(() => {
    req = {grants: {}}
    res = {status: jest.fn(), json: jest.fn(), end: jest.fn()}
    next = jest.fn()
  })

  describe('createHandleErrorMiddleware', () => {
    const createMiddleware = handlers.createHandleErrorMiddleware

    it('should handle assertion errors', () => {
      const middleware = createMiddleware()
      const err = new AssertionError('invalid thing')
      middleware(err, req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({name: 'AssertionError', message: 'invalid thing'})
    })
  })

  describe('createHandlePromiseMiddleware', () => {
    const createMiddleware = handlers.createHandlePromiseMiddleware

    it('should handle promises with body', async () => {
      const middleware = createMiddleware()
      res.promise = Promise.resolve({foo: 'bar'})
      await middleware(req, res, next)

      expect(res.body).toEqual({foo: 'bar'})
      expect(res.json).toHaveBeenCalledWith({foo: 'bar'})
    })

    it('should handle promises without body', async () => {
      const middleware = createMiddleware()
      res.promise = Promise.resolve()
      await middleware(req, res, next)

      expect(res.status).toHaveBeenCalledWith(204)
      expect(res.json).not.toHaveBeenCalled()
    })
  })
})
