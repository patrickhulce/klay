const auth = require('../../lib/auth/grants')

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
      expect(permissions).toEqual(['posts:read'])
    })

    it('should return child permissions', () => {
      const permissions = auth.computeAllPermissions('posts:admin', conf)
      expect(permissions).toEqual(['posts:admin', 'posts:read'])
    })

    it('should return all permissions', () => {
      const permissions = auth.computeAllPermissions('accounts:admin', conf)
      expect(permissions).toEqual([
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
      expect(grants).toBeInstanceOf(Set)
      expect(grants).toHaveProperty('size', 6)
    })

    it('should replace domain properties', () => {
      const grants = computeAsArray('owner', {id: 1, accountId: 2}, conf)
      expect(grants).toEqual([
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
      expect(fn).toThrowError(/invalid permission/)
    })

    it('should throw on invalid criteria', () => {
      const roles = {...conf.roles, foo: [{permission: 'accounts:admin', criteria: ['id']}]}
      const fn = () => computeAsArray('foo', {id: 1}, {...conf, roles})
      expect(fn).toThrowError(/invalid criteria/)
    })
  })

  describe('.has', () => {
    let roles, permissions, grants

    beforeEach(() => {
      roles = {
        root: [{permission: 'write', criteria: '*'}, {permission: 'read:public', criteria: '*'}],
        user: [
          {permission: 'write', criteria: ['userId=<%= id %>', 'orgId=<%= orgId %>']},
          {permission: 'read', criteria: ['orgId=<%= orgId %>']},
          {permission: 'read:public', criteria: []},
        ],
      }

      permissions = {'write': ['read'], 'read': [], 'read:public': []}

      grants = new auth.Grants(['user'], {id: 1, orgId: 2}, {roles, permissions})
    })

    it('should correctly report on global permissions', () => {
      grants = new auth.Grants(['root'], {id: 1, orgId: 2}, {roles, permissions})
      expect(grants.has('write', {orgId: 2})).toBe(true)
      expect(grants.has('write', {orgId: 10})).toBe(true)
      expect(grants.has('write', {})).toBe(true)
      expect(grants.has('write')).toBe(true)
      expect(grants.has('read', {orgId: 2})).toBe(true)
      expect(grants.has('read', {orgId: 15})).toBe(true)
      expect(grants.has('read:public', {orgId: 15})).toBe(true)
    })

    it('should correctly report on simple permissions', () => {
      grants = new auth.Grants(['user'], {id: 1, orgId: 2}, {roles, permissions})
      expect(grants.has('write', {orgId: 2, userId: 1})).toBe(true)
      expect(grants.has('write', {orgId: 10})).toBe(false)
      expect(grants.has('write', {})).toBe(false)
      expect(grants.has('read', {orgId: 2})).toBe(true)
      expect(grants.has('read', {orgId: 15})).toBe(false)
      expect(grants.has('read:public', {orgId: 15})).toBe(true)
    })
  })
})
