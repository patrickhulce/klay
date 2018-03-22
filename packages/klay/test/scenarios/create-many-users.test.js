const _ = require('lodash')
const expect = require('chai').expect
const fetch = require('isomorphic-fetch')
const URLSearchParams = require('url').URLSearchParams

module.exports = state => {
  let user

  describe('bulk users', () => {
    beforeEach(() => {
      user = {
        accountId: state.account.id,
        role: 'user',
        email: 'unset@bar.com',
        password: 'password',
        firstName: 'Foo',
        lastName: 'Bar',
      }
    })

    it('should create many users', async () => {
      const users = [
        {...user, email: 'foo1@bar.com'},
        {...user, email: 'foo2@bar.com'},
        {...user, email: 'foo3@baz.com'},
      ]

      const response = await fetch(`${state.baseURL}/v1/users/bulk`, {
        method: 'POST',
        body: JSON.stringify(users),
        headers: {'content-type': 'application/json', cookie: state.userCookie},
      })

      expect(response.status).to.equal(200)
      state.users = await response.json()
      expect(state.users).to.have.length(3)
      for (const user of state.users) {
        expect(user)
          .to.have.property('id')
          .a('number')
        expect(user).to.have.property('createdAt')
        expect(user).to.have.property('updatedAt')
      }
    })

    it('should prevent duplicate users', async () => {
      const response = await fetch(`${state.baseURL}/v1/users/bulk`, {
        method: 'POST',
        body: JSON.stringify([user, user]),
        headers: {'content-type': 'application/json', cookie: state.userCookie},
      })

      expect(response.status).to.equal(400)
    })

    it('should list users', async () => {
      const headers = {cookie: state.userCookie}
      const queryParams = new URLSearchParams({fields: 'id', accountId: state.account.id})
      const response = await fetch(`${state.baseURL}/v1/users?${queryParams.toString()}`, {headers})
      expect(response.status).to.equal(200)

      const responseBody = await response.json()
      expect(responseBody.data).to.eql([
        {id: state.user.id},
        {id: state.userA.id},
        {id: state.users[0].id},
        {id: state.users[1].id},
        {id: state.users[2].id},
      ])
    })

    it('should query users', async () => {
      const headers = {cookie: state.userCookie}
      const queryParams = new URLSearchParams({
        'email[$match]': 'foo.*bar',
        accountId: state.account.id,
      })

      const response = await fetch(`${state.baseURL}/v1/users?${queryParams.toString()}`, {headers})
      expect(await response.json()).to.have.property('total', 3)
    })

    it('should update users', async () => {
      const users = state.users.map(user => {
        return {...user, firstName: 'Changed'}
      })

      const response = await fetch(`${state.baseURL}/v1/users/bulk`, {
        method: 'PUT',
        body: JSON.stringify(users),
        headers: {'content-type': 'application/json', cookie: state.userCookie},
      })

      expect(response.status).to.equal(200)
    })

    it('should list updated users', async () => {
      const headers = {cookie: state.userCookie}
      const ids = state.users.map(user => user.id)
      const queryParams = new URLSearchParams({
        'id[$in]': ids.join(','),
        accountId: state.account.id,
      })

      const response = await fetch(`${state.baseURL}/v1/users?${queryParams.toString()}`, {headers})
      const updatedUsers = (await response.json()).data
      expect(updatedUsers).to.have.length(3)

      for (const updatedUser of updatedUsers) {
        const index = updatedUsers.indexOf(updatedUser)
        const user = state.users[index]
        expect(updatedUser).to.include({firstName: 'Changed'})
        expect(new Date(updatedUser.updatedAt)).to.be.greaterThan(new Date(user.updatedAt))

        const withoutUpdates = _.omit(updatedUser, ['firstName', 'updatedAt'])
        expect({...user, ...withoutUpdates}).to.eql(user)
      }
    })

    it('should delete users', async () => {
      const ids = state.users.map(user => user.id)
      const response = await fetch(`${state.baseURL}/v1/users/bulk`, {
        method: 'DELETE',
        body: JSON.stringify(ids),
        headers: {'content-type': 'application/json', cookie: state.userCookie},
      })

      expect(response.status).to.equal(204)
    })
  })
}
