const expect = require('chai').expect
const fetch = require('isomorphic-fetch')

module.exports = state => {
  let account

  describe('account', () => {
    beforeEach(() => {
      account = {
        name: 'CSN Bay Area',
        plan: 'free',
      }
    })

    it('should create a account', async () => {
      const response = await fetch(`${state.baseURL}/v1/accounts`, {
        method: 'POST',
        body: JSON.stringify(account),
        headers: {'content-type': 'application/json'},
      })

      expect(response.status).to.equal(200)
      state.account = await response.json()
      expect(state.account).to.have.property('slug', 'csn-bay-area')
    })

    it('should read an account', async () => {
      const response = await fetch(`${state.baseURL}/v1/accounts/${state.account.id}`)
      const account = await response.json()
      expect(account).to.eql(state.account)
    })

    it('should update an account', async () => {
      const response = await fetch(`${state.baseURL}/v1/accounts/${state.account.id}`, {
        method: 'PUT',
        body: JSON.stringify({...state.account, name: 'Changed', slug: 'special-slug'}),
        headers: {'content-type': 'application/json'},
      })

      expect(response.status).to.equal(200)
      const updatedAccount = await response.json()
      expect(updatedAccount).to.include({name: 'Changed', slug: 'special-slug'})
    })
  })
}
