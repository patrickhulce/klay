const auth = require('../../lib/auth/grants')

describe('lib/auth/grants.ts', () => {
  const accountIdCriteria = {accountId: '<%= accountId %>'}
  const userIdCriteria = {userId: '<%= id %>'}
  const conf = {
    roles: {
      root: [{permission: 'accounts:admin', criteria: '*'}],
      owner: [
        {permission: 'accounts:admin', criteria: accountIdCriteria},
        {permission: 'posts:admin', criteria: {...accountIdCriteria, ...userIdCriteria}},
        {permission: 'posts:read', criteria: {private: false}},
      ],
      user: [
        {permission: 'accounts:read', criteria: accountIdCriteria},
        {permission: 'users:read', criteria: accountIdCriteria},
        {permission: 'users:admin', criteria: {id: '<%= id %>'}},
        {permission: 'posts:admin', criteria: {...accountIdCriteria, ...userIdCriteria}},
        {permission: 'posts:read', criteria: accountIdCriteria},
        {permission: 'posts:read', criteria: {private: false}},
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
    it('should return set of grants', () => {
      const [grants, permissionsMap] = auth.computeAllGrants('root', {}, conf)
      expect(grants).toBeInstanceOf(Set)
      expect(grants).toHaveProperty('size', 6)
      expect(permissionsMap).toBeInstanceOf(Map)
      expect(permissionsMap).toHaveProperty('size', 6)
    })

    it('should create permission property map', () => {
      const permissionsMap = auth.computeAllGrants('root', {}, conf)[1]
      expect(permissionsMap).toMatchSnapshot()
    })

    it('should create grants with criteria properties', () => {
      const grants = auth.computeAllGrants('owner', {id: 1, accountId: 2}, conf)[0]
      expect(grants).toMatchSnapshot()
    })

    it('should create permission property map with criteria properties', () => {
      const permissionsMap = auth.computeAllGrants('owner', {id: 1, accountId: 2}, conf)[1]
      expect(permissionsMap).toMatchSnapshot()
    })

    it('should throw on invalid permission', () => {
      const roles = {...conf.roles, foo: [{permission: 'account:admin', criteria: '*'}]}
      const fn = () => auth.computeAllGrants('foo', {}, {...conf, roles})
      expect(fn).toThrowError(/invalid permission/)
    })

    it('should throw on invalid criteria', () => {
      const roles = {...conf.roles, foo: [{permission: 'accounts:admin', criteria: ['id']}]}
      const fn = () => auth.computeAllGrants('foo', {id: 1}, {...conf, roles})
      expect(fn).toThrowError(/invalid criteria/)
    })
  })

  describe('.has', () => {
    let roles, permissions, grants

    beforeEach(() => {
      roles = {
        root: [{permission: 'write', criteria: '*'}, {permission: 'read:public', criteria: '*'}],
        user: [
          {permission: 'write', criteria: {userId: '<%= id %>', orgId: '<%= orgId %>'}},
          {permission: 'read', criteria: {orgId: '<%= orgId %>'}},
          {permission: 'read:public', criteria: '*'},
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
