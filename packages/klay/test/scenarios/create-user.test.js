const fetch = require('isomorphic-fetch')

module.exports = state => {
  let user

  describe('user', () => {
    beforeEach(() => {
      user = {
        accountId: state.account.id,
        role: 'user',
        email: 'foo@bar.com',
        password: 'password',
        firstName: 'Foo',
        lastName: 'Bar',
      }
    })

    it('should check authentication', async () => {
      const response = await fetch(`${state.baseURL}/v1/users`, {
        method: 'POST',
        body: JSON.stringify(user),
        headers: {'content-type': 'application/json'},
      })

      expect(response.status).toBe(401)
    })

    it('should create a user', async () => {
      const response = await fetch(`${state.baseURL}/v1/users`, {
        method: 'POST',
        body: JSON.stringify(user),
        headers: {'content-type': 'application/json', cookie: state.userCookie},
      })

      expect(response.status).toBe(200)
      state.userA = await response.json()
      expect(state.userA.password).toMatch(/^[a-f0-9]{40}$/)
    })

    it('should check authorization', async () => {
      const login = {grant_type: 'password', username: 'foo@bar.com', password: 'password'}
      const loginResponse = await fetch(`${state.baseURL}/v1/oauth/token`, {
        method: 'POST',
        body: JSON.stringify(login),
        headers: {'content-type': 'application/json'},
      })

      const token = (await loginResponse.json()).access_token
      const cookie = `token=${token}`
      const response = await fetch(`${state.baseURL}/v1/users`, {
        method: 'POST',
        body: JSON.stringify(user),
        headers: {'content-type': 'application/json', cookie},
      })

      expect(response.status).toBe(403)
    })

    it('should create a 2nd user', async () => {
      const response = await fetch(`${state.baseURL}/v1/users`, {
        method: 'POST',
        body: JSON.stringify({...user, email: 'foo2@bar.com'}),
        headers: {'content-type': 'application/json', cookie: state.userCookie},
      })

      expect(response.status).toBe(200)
      state.userB = await response.json()
      expect(state.userB.password).toMatch(/^[a-f0-9]{40}$/)
    })

    it('should prevent duplicate user', async () => {
      const response = await fetch(`${state.baseURL}/v1/users`, {
        method: 'POST',
        body: JSON.stringify(user),
        headers: {'content-type': 'application/json', cookie: state.userCookie},
      })

      expect(response.status).toBe(400)
    })

    it('should list users', async () => {
      const headers = {cookie: state.userCookie}
      const response = await fetch(`${state.baseURL}/v1/users?accountId=${state.account.id}`, {
        headers,
      })
      const users = await response.json()
      expect(users).toEqual({
        data: [state.user, state.userA, state.userB],
        total: 3,
        limit: 10,
        offset: 0,
      })
    })

    it('should read a user', async () => {
      const headers = {cookie: state.userCookie}
      const response = await fetch(`${state.baseURL}/v1/users/${state.user.id}`, {headers})
      const user = await response.json()
      expect(user).toEqual(state.user)
    })

    it('should update a user', async () => {
      const response = await fetch(`${state.baseURL}/v1/users/${state.user.id}`, {
        method: 'PUT',
        body: JSON.stringify({...state.user, firstName: 'Changed', password: 'other'}),
        headers: {'content-type': 'application/json', cookie: state.userCookie},
      })

      expect(response.status).toBe(200)
      const updatedUser = await response.json()
      expect(updatedUser).toMatchObject({firstName: 'Changed'})
      expect(updatedUser.password).toMatch(/^[a-f0-9]{40}$/)
    })

    it('should delete a user', async () => {
      const response = await fetch(`${state.baseURL}/v1/users/${state.userB.id}`, {
        method: 'DELETE',
        headers: {cookie: state.userCookie},
      })

      expect(response.status).toBe(204)
      delete state.userB
    })
  })
}
