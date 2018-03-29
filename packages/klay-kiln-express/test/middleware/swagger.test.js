const middlewareModule = require('../../lib/middleware/swagger')

describe('lib/middleware/swagger.ts', () => {
  describe('#createSwaggerSpecHandler', () => {
    let req, res, json, getHeader
    const createHandler = middlewareModule.createSwaggerSpecHandler

    beforeEach(() => {
      getHeader = jest.fn()
      json = jest.fn()
      req = {get: getHeader, originalUrl: ''}
      res = {json}
    })

    it('should return swagger spec', () => {
      const spec = {info: {title: 'Hello', version: 'v1'}}
      const handler = createHandler(spec)
      handler(req, res)
      expect(json.mock.calls[0][0]).toMatchObject(spec)
    })

    it('should override base path', () => {
      const spec = {info: {title: 'Hello', version: 'v1'}}
      const handler = createHandler(spec)
      req.originalUrl = '/v1/swagger-spec_v1.json?foo=bar'
      handler(req, res)
      expect(json.mock.calls[0][0]).toMatchObject({basePath: '/v1'})
    })
  })
})
