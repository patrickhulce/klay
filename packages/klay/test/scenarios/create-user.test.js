const expect = require('chai').expect
const fetch = require('isomorphic-fetch')

module.exports = state => {
  let user

  beforeEach(() => {
    user = {
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
      headers: {'content-type': 'application/json'},
    })

    expect(response.status).to.equal(200)
    state.user = await response.json()
    expect(state.user)
      .to.have.property('password')
      .match(/^[a-f0-9]{40}$/)
  })

  it('should create a 2nd user', async () => {
    const response = await fetch(`${state.baseURL}/v1/users`, {
      method: 'POST',
      body: JSON.stringify({...user, email: 'foo2@bar.com'}),
      headers: {'content-type': 'application/json'},
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
      headers: {'content-type': 'application/json'},
    })

    expect(response.status).to.not.equal(200)
  })

  it('should list users', async () => {
    const response = await fetch(`${state.baseURL}/v1/users`)
    const users = await response.json()
    expect(users).to.eql({data: [state.user, state.userB], total: 2, limit: 10, offset: 0})
  })

  it('should read a user', async () => {
    const response = await fetch(`${state.baseURL}/v1/users/${state.user.id}`)
    const user = await response.json()
    expect(user).to.eql(state.user)
  })

  it('should update a user', async () => {
    const response = await fetch(`${state.baseURL}/v1/users/${state.user.id}`, {
      method: 'PUT',
      body: JSON.stringify({...state.user, firstName: 'Changed', password: 'other'}),
      headers: {'content-type': 'application/json'},
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
    })

    expect(response.status).to.equal(204)
    delete state.userB
  })
}
