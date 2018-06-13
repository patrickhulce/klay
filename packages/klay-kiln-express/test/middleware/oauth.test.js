const jwt = require('jsonwebtoken')
const createNewPasswordHashSalt = require('klay-db/lib/password').createNewPasswordHashSalt
const middlewareModule = require('../../lib/middleware/oauth')
const utils = require('../utils')

describe('lib/middleware/oauth.ts', () => {
  let next, json, executor, kiln, passwordModel

  beforeEach(() => {
    next = jest.fn()
    json = jest.fn()
    const state = utils.state()
    kiln = state.kiln
    passwordModel = state.model.spec.children.find(child => child.path === 'password').model
    executor = state.executor
  })

  describe('#createOAuthTokenHandler', () => {
    const createHandler = middlewareModule.createOAuthTokenHandler

    it('should throw auth error when no user returned', async () => {
      const handler = createHandler({secret: 'secret', kiln, databaseExtension: 'db'})
      const body = {username: 'klay', password: 'rocko'}
      const findStub = jest.spyOn(executor, 'findOne').mockReturnValue()
      await handler({body}, {json}, next)

      expect(next).toHaveBeenCalled()
      const nextArg = next.mock.calls[0][0]
      expect(nextArg).toBeInstanceOf(Error)
      expect(nextArg.name).toBe('AuthenticationError')
      expect(findStub).toHaveBeenCalledWith({where: {email: 'klay'}})
    })

    it('should return token when user returned', async () => {
      const handler = createHandler({secret: 'secret', kiln, databaseExtension: 'db'})
      const body = {username: 'klay', password: 'rocko'}
      const hashedPassword = createNewPasswordHashSalt('rocko', passwordModel.spec.db.password)
      jest.spyOn(executor, 'findOne').mockReturnValue({id: 6, password: hashedPassword})

      await handler({body}, {json}, next)

      expect(next).not.toHaveBeenCalled()
      expect(json).toHaveBeenCalled()
      const response = json.mock.calls[0][0]
      const payload = jwt.verify(response.access_token, 'secret')
      expect(payload).toMatchObject({id: 6})
      expect(typeof response.expires_in).toBe('number')
    })

    it('should set cookie', async () => {
      const handler = createHandler({secret: 'secret', kiln, databaseExtension: 'db'})
      const body = {username: 'klay', password: 'rocko'}
      const hashedPassword = createNewPasswordHashSalt('rocko', passwordModel.spec.db.password)
      const cookie = jest.fn()
      jest.spyOn(executor, 'findOne').mockReturnValue({password: hashedPassword})

      await handler({body}, {json, cookie}, next)
      expect(next).not.toHaveBeenCalled()
      expect(cookie).toHaveBeenCalled()
    })
  })
})
