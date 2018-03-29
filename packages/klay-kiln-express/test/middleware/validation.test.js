const ModelContext = require('klay-core').ModelContext
const middlewareModule = require('../../lib/middleware/validation')

describe('lib/middleware/validation.ts', () => {
  let context, model, next

  beforeEach(() => {
    context = new ModelContext()
    model = context.object().children({id: context.integer()})
    next = jest.fn()
  })

  describe('#createValidationMiddleware', () => {
    const createMiddleware = middlewareModule.createValidationMiddleware

    it('should create a function', () => {
      const middleware = createMiddleware(model)
      expect(typeof middleware).toBe('function')
    })

    it('should set validated', () => {
      const middleware = createMiddleware(model)
      const req = {body: {id: '1'}}
      middleware(req, {}, next)
      expect(req.validated).toEqual({body: {id: 1}})
      expect(req.body).toEqual({id: '1'})
      expect(next).toHaveBeenCalledTimes(1)
    })

    it('should merge validated', () => {
      const middleware = createMiddleware(model, 'query')
      const req = {body: {id: '1'}, validated: {params: 1}}
      middleware(req, {}, next)
      expect(req.validated).toEqual({params: 1, query: undefined})
      expect(req.body).toEqual({id: '1'})
    })

    it('should validate against model', () => {
      const middleware = createMiddleware(model)
      const req = {body: {id: 'one'}}
      const res = {}

      middleware(req, res, next)
      expect(next).toHaveBeenCalledTimes(1)
      const err = next.mock.calls[0][0]
      expect(err.value).toEqual({id: 'one'})
      expect(err.errors).toHaveLength(1)
      expect(err.errors[0].path).toEqual(['id'])
      expect(err.errors[0].message).toMatch(/expected.*number/)
    })
  })
})
