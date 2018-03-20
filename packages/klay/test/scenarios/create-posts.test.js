const _ = require('lodash')
const expect = require('chai').expect
const fetch = require('isomorphic-fetch')
const URLSearchParams = require('url').URLSearchParams

module.exports = state => {
  let post

  describe('posts', () => {
    beforeEach(() => {
      post = {
        accountId: state.account.id,
        userId: state.user.id,
        title: 'My Post',
        body: 'This is a fascinating post...',
      }
    })

    it('should create post', async () => {
      const response = await fetch(`${state.baseURL}/v1/posts`, {
        method: 'POST',
        body: JSON.stringify(post),
        headers: {
          'content-type': 'application/json',
        },
      })

      expect(response.status).to.equal(200)
      state.post = await response.json()
      expect(state.post).to.have.property('id').a('number')
      expect(_.omit(state.post, ['id', 'createdAt', 'updatedAt'])).to.eql({
        accountId: state.account.id,
        userId: state.user.id,
        title: 'My Post',
        body: 'This is a fascinating post...',
        private: false,
      })
    })
  })
}
