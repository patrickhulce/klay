const fetch = require('isomorphic-fetch')

module.exports = state => {
  describe('account', () => {
    it('should reject bad passwords', async () => {
      const signup = {
        name: 'CSN Bay Area',
        firstName: 'Klay',
        lastName: 'Thompson',
        email: 'klay@example.com',
        password: 'password',
      }

      const response = await fetch(`${state.baseURL}/v1/accounts/signup`, {
        method: 'POST',
        body: JSON.stringify(signup),
        headers: {'content-type': 'application/json'},
      })

      expect(response.status).toBe(400)
    })

    it('should create an account', async () => {
      const signup = {
        name: 'CSN Bay Area',
        firstName: 'Klay',
        lastName: 'Thompson',
        email: 'klay@example.com',
        password: 'rocko',
      }

      const response = await fetch(`${state.baseURL}/v1/accounts/signup`, {
        method: 'POST',
        body: JSON.stringify(signup),
        headers: {'content-type': 'application/json'},
      })

      expect(response.status).toBe(200)
      const {account, user} = await response.json()
      state.account = account
      state.user = user

      expect(account).toHaveProperty('slug', 'csn-bay-area')
      expect(user.password).toMatch(/^[a-f0-9]{40}$/)
      console.log(user)
    })

    it('should login', async () => {
      const payload = {
        grant_type: 'password',
        username: 'klay@example.com',
        password: 'rocko',
      }

      const response = await fetch(`${state.baseURL}/v1/oauth/token`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {'content-type': 'application/json'},
      })

      expect(response.status).toBe(200)
      const responseBody = await response.json()
      expect(responseBody.access_token).toMatch(/.*\..*\..*/)
      state.userCookie = `token=${responseBody.access_token};`
    })

    it('should prevent bad logins', async () => {
      const payload = {
        grant_type: 'password',
        username: 'klay@example.com',
        password: 'rocko2',
      }

      const response = await fetch(`${state.baseURL}/v1/oauth/token`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {'content-type': 'application/json'},
      })

      expect(response.status).toBe(401)
    })

    it('should read an account', async () => {
      const headers = {cookie: state.userCookie}
      const response = await fetch(`${state.baseURL}/v1/accounts/${state.account.id}`, {headers})
      const account = await response.json()
      expect(account).toEqual(state.account)
    })

    it('should check authentication', async () => {
      const response = await fetch(`${state.baseURL}/v1/accounts`)
      expect(response.status).toBe(401)
    })

    it('should check authorization', async () => {
      const headers = {cookie: state.userCookie}
      const response = await fetch(`${state.baseURL}/v1/accounts`, {headers})
      expect(response.status).toBe(403)
    })

    it('should update an account', async () => {
      const response = await fetch(`${state.baseURL}/v1/accounts/${state.account.id}`, {
        method: 'PUT',
        body: JSON.stringify({...state.account, name: 'Changed', slug: 'special-slug'}),
        headers: {'content-type': 'application/json', cookie: state.userCookie},
      })

      expect(response.status).toBe(200)
      const updatedAccount = await response.json()
      expect(updatedAccount).toMatchObject({name: 'Changed', slug: 'special-slug'})
    })
  })
}
