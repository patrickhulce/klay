const expect = require('chai').expect
const auth = require('../../dist/helpers/auth')

describe('lib/helpers/auth.ts', () => {
  const conf = {
    roles: {
      root: ['accounts:admin!*'],
      owner: [
        'accounts:admin!accountId=<%= accountId %>',
        'posts:admin!accountId=<%= accountId %>,userId=<%= id %>',
        'posts:read!private=false',
      ],
      user: [
        'accounts:read!accountId=<%= accountId %>',
        'users:read!accountId=<%= accountId %>',
        'users:admin!id=<%= id %>',
        'posts:admin!accountId=<%= accountId %>,userId=<%= id %>',
        'posts:read!accountId=<%= accountId %>',
        'posts:read!private=false',
      ],
    },
    scopes: {
      'accounts:admin': ['accounts:read', 'users:admin', 'posts:admin'],
      'accounts:read': [],
      'users:admin': ['users:read'],
      'users:read': [],
      'posts:admin': ['posts:read'],
      'posts:read': [],
    },
  }

  describe('#computeAllScopes', () => {
    it('should return the scope', () => {
      const scopes = auth.computeAllScopes('posts:read', conf)
      expect(scopes).to.eql(['posts:read'])
    })

    it('should return child scopes', () => {
      const scopes = auth.computeAllScopes('posts:admin', conf)
      expect(scopes).to.eql(['posts:admin', 'posts:read'])
    })

    it('should return all scopes', () => {
      const scopes = auth.computeAllScopes('accounts:admin', conf)
      expect(scopes).to.eql([
        'accounts:admin',
        'accounts:read',
        'users:admin',
        'posts:admin',
        'users:read',
        'posts:read',
      ])
    })
  })

  describe('#computeAllGrants', () => {
    const computeAsArray = (...args) => Array.from(auth.computeAllGrants(...args))

    it('should return set of grants', () => {
      const grants = auth.computeAllGrants('root', {}, conf)
      expect(grants).to.be.instanceof(Set)
      expect(grants).to.have.property('size', 6)
    })

    it('should replace domain properties', () => {
      const grants = computeAsArray('owner', {id: 1, accountId: 2}, conf)
      expect(grants).to.eql([
        'accounts:admin!accountId=2',
        'accounts:read!accountId=2',
        'users:admin!accountId=2',
        'posts:admin!accountId=2',
        'users:read!accountId=2',
        'posts:read!accountId=2',
        'posts:admin!accountId=2,userId=1',
        'posts:read!accountId=2,userId=1',
        'posts:read!private=false',
      ])
    })

    it('should throw on invalid scope', () => {
      const roles = {...conf.roles, foo: ['account:admin!*']}
      const fn = () => computeAsArray('foo', {}, {...conf, roles})
      expect(fn).to.throw(/invalid scope/)
    })

    it('should throw on invalid domain', () => {
      const roles = {...conf.roles, foo: ['accounts:admin!id<%= id %>']}
      const fn = () => computeAsArray('foo', {id: 1}, {...conf, roles})
      expect(fn).to.throw(/invalid domain/)
    })
  })
})
