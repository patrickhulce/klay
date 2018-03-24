const _ = require('lodash')
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
        headers: {'content-type': 'application/json', cookie: state.userCookie},
      })

      expect(response.status).toBe(200)
      state.post = await response.json()
      expect(typeof state.post.id).toBe('number')
      expect(_.omit(state.post, ['id', 'createdAt', 'updatedAt'])).toEqual({
        accountId: state.account.id,
        userId: state.user.id,
        title: 'My Post',
        body: 'This is a fascinating post...',
        private: false,
      })
    })
  })
}
