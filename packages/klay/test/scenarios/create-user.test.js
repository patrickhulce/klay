const expect = require('chai').expect
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

    it('should create a user', async () => {
      const response = await fetch(`${state.baseURL}/v1/users`, {
        method: 'POST',
        body: JSON.stringify(user),
        headers: {'content-type': 'application/json', cookie: state.userCookie},
      })

      expect(response.status).to.equal(200)
      state.userA = await response.json()
      expect(state.userA)
        .to.have.property('password')
        .match(/^[a-f0-9]{40}$/)
    })

    it('should create a 2nd user', async () => {
      const response = await fetch(`${state.baseURL}/v1/users`, {
        method: 'POST',
        body: JSON.stringify({...user, email: 'foo2@bar.com'}),
        headers: {'content-type': 'application/json', cookie: state.userCookie},
      })

      expect(response.status).to.equal(200)
      state.userB = await response.json()
      expect(state.userB)
        .to.have.property('password')
        .match(/^[a-f0-9]{40}$/)
    })

    it('should prevent duplicate user', async () => {
      const response = await fetch(`${state.baseURL}/v1/users`, {
        method: 'POST',
        body: JSON.stringify(user),
        headers: {'content-type': 'application/json', cookie: state.userCookie},
      })

      // TODO: assert 400
      expect(response.status).to.not.equal(200)
    })

    it('should list users', async () => {
      const response = await fetch(`${state.baseURL}/v1/users`)
      const users = await response.json()
      expect(users).to.eql({data: [state.user, state.userA, state.userB], total: 3, limit: 10, offset: 0})
    })

    it('should read a user', async () => {
      const headers = {cookie: state.userCookie}
      const response = await fetch(`${state.baseURL}/v1/users/${state.user.id}`, {headers})
      const user = await response.json()
      expect(user).to.eql(state.user)
    })

    it('should update a user', async () => {
      const response = await fetch(`${state.baseURL}/v1/users/${state.user.id}`, {
        method: 'PUT',
        body: JSON.stringify({...state.user, firstName: 'Changed', password: 'other'}),
        headers: {'content-type': 'application/json', cookie: state.userCookie},
      })

      expect(response.status).to.equal(200)
      const updatedUser = await response.json()
      expect(updatedUser).to.include({firstName: 'Changed'})
      expect(updatedUser)
        .to.have.property('password')
        .match(/^[a-f0-9]{40}$/)
      expect(new Date(updatedUser.updatedAt)).to.be.greaterThan(new Date(state.user.updatedAt))
    })

    it('should delete a user', async () => {
      const response = await fetch(`${state.baseURL}/v1/users/${state.userB.id}`, {
        method: 'DELETE',
        headers: {cookie: state.userCookie},
      })

      expect(response.status).to.equal(204)
      delete state.userB
    })
  })
}
