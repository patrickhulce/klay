const expect = require('chai').expect
const fetch = require('isomorphic-fetch')

module.exports = state => {
  describe('account', () => {
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

      expect(response.status).to.equal(200)
      const {account, user} = await response.json()
      state.account = account
      state.user = user
      state.userCookie = `id=${user.id};accountId=${user.accountId};role=${user.role}`

      expect(account).to.have.property('slug', 'csn-bay-area')
      expect(user).to.have.property('password').match(/^[a-f0-9]{40}$/)
    })

    it('should read an account', async () => {
      const headers = {cookie: state.userCookie}
      const response = await fetch(`${state.baseURL}/v1/accounts/${state.account.id}`, {headers})
      const account = await response.json()
      expect(account).to.eql(state.account)
    })

    it('should check authentication', async () => {
      const response = await fetch(`${state.baseURL}/v1/accounts`)
      expect(response.status).to.equal(401)
    })

    it('should check authorization', async () => {
      const headers = {cookie: state.userCookie}
      const response = await fetch(`${state.baseURL}/v1/accounts`, {headers})
      expect(response.status).to.equal(403)
    })

    it('should update an account', async () => {
      const response = await fetch(`${state.baseURL}/v1/accounts/${state.account.id}`, {
        method: 'PUT',
        body: JSON.stringify({...state.account, name: 'Changed', slug: 'special-slug'}),
        headers: {'content-type': 'application/json', cookie: state.userCookie},
      })

      expect(response.status).to.equal(200)
      const updatedAccount = await response.json()
      expect(updatedAccount).to.include({name: 'Changed', slug: 'special-slug'})
    })
  })
}
