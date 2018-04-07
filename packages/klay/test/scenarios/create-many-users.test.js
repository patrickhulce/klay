const _ = require('lodash')
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
        password: 'password2',
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

      expect(response.status).toBe(200)
      state.users = await response.json()
      expect(state.users).toHaveLength(3)
      for (const user of state.users) {
        expect(typeof user.id).toBe('number')
        expect(user).toHaveProperty('createdAt')
        expect(user).toHaveProperty('updatedAt')
      }
    })

    it('should prevent duplicate users', async () => {
      const response = await fetch(`${state.baseURL}/v1/users/bulk`, {
        method: 'POST',
        body: JSON.stringify([user, user]),
        headers: {'content-type': 'application/json', cookie: state.userCookie},
      })

      expect(response.status).toBe(400)
    })

    it('should list users', async () => {
      const headers = {cookie: state.userCookie}
      const queryParams = new URLSearchParams({fields: 'id', accountId: state.account.id})
      const response = await fetch(`${state.baseURL}/v1/users?${queryParams.toString()}`, {
        headers,
      })
      expect(response.status).toBe(200)

      const responseBody = await response.json()
      expect(responseBody.data).toEqual([
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

      const response = await fetch(`${state.baseURL}/v1/users?${queryParams.toString()}`, {
        headers,
      })
      expect(await response.json()).toHaveProperty('total', 3)
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

      expect(response.status).toBe(200)
    })

    it('should list updated users', async () => {
      const headers = {cookie: state.userCookie}
      const ids = state.users.map(user => user.id)
      const queryParams = new URLSearchParams({
        'id[$in]': ids.join(','),
        accountId: state.account.id,
      })

      const response = await fetch(`${state.baseURL}/v1/users?${queryParams.toString()}`, {
        headers,
      })
      const updatedUsers = (await response.json()).data
      expect(updatedUsers).toHaveLength(3)

      for (const updatedUser of updatedUsers) {
        const index = updatedUsers.indexOf(updatedUser)
        const user = state.users[index]
        expect(updatedUser).toMatchObject({firstName: 'Changed'})

        const withoutUpdates = _.omit(updatedUser, ['firstName', 'updatedAt'])
        expect({...user, ...withoutUpdates}).toEqual(user)
      }
    })

    it('should delete users', async () => {
      const ids = state.users.map(user => user.id)
      const response = await fetch(`${state.baseURL}/v1/users/bulk`, {
        method: 'DELETE',
        body: JSON.stringify(ids),
        headers: {'content-type': 'application/json', cookie: state.userCookie},
      })

      expect(response.status).toBe(204)
    })
  })
}
