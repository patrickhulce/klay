const expect = require('chai').expect
const auth = require('../../dist/auth/grants')

describe('lib/auth/grants.ts', () => {
  const conf = {
    roles: {
      root: [{permission: 'accounts:admin', criteria: ['*']}],
      owner: [
        {permission: 'accounts:admin', criteria: ['accountId=<%= accountId %>']},
        {permission: 'posts:admin', criteria: ['accountId=<%= accountId %>', 'userId=<%= id %>']},
        {permission: 'posts:read', criteria: ['private=false']},
      ],
      user: [
        {permission: 'accounts:read', criteria: ['accountId=<%= accountId %>']},
        {permission: 'users:read', criteria: ['accountId=<%= accountId %>']},
        {permission: 'users:admin', criteria: ['id=<%= id %>']},
        {permission: 'posts:admin', criteria: ['accountId=<%= accountId %>', 'userId=<%= id %>']},
        {permission: 'posts:read', criteria: ['accountId=<%= accountId %>']},
        {permission: 'posts:read', criteria: ['private=false']},
      ],
    },
    permissions: {
      'accounts:admin': ['accounts:read', 'users:admin', 'posts:admin'],
      'accounts:read': [],
      'users:admin': ['users:read'],
      'users:read': [],
      'posts:admin': ['posts:read'],
      'posts:read': [],
    },
  }

  describe('#computeAllPermissions', () => {
    it('should return the permission', () => {
      const permissions = auth.computeAllPermissions('posts:read', conf)
      expect(permissions).to.eql(['posts:read'])
    })

    it('should return child permissions', () => {
      const permissions = auth.computeAllPermissions('posts:admin', conf)
      expect(permissions).to.eql(['posts:admin', 'posts:read'])
    })

    it('should return all permissions', () => {
      const permissions = auth.computeAllPermissions('accounts:admin', conf)
      expect(permissions).to.eql([
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

    it('should throw on invalid permission', () => {
      const roles = {...conf.roles, foo: [{permission: 'account:admin', criteria: ['*']}]}
      const fn = () => computeAsArray('foo', {}, {...conf, roles})
      expect(fn).to.throw(/invalid permission/)
    })

    it('should throw on invalid criteria', () => {
      const roles = {...conf.roles, foo: [{permission: 'accounts:admin', criteria: ['id']}]}
      const fn = () => computeAsArray('foo', {id: 1}, {...conf, roles})
      expect(fn).to.throw(/invalid criteria/)
    })
  })
})
