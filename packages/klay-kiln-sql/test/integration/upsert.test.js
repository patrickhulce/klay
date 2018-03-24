const _ = require('lodash')
const utils = require('../utils')

describe('upsert objects', () => {
  const state = utils.state()

  utils.steps.cleanAndSync(state)

  describe('users', () => {
    const defaultUser = {
      age: 23,
      isAdmin: true,
      email: 'test@klay.com',
      password: 'password',
      firstName: 'klay-core',
      lastName: 'Thompson',
    }

    it('should create a user', async () => {
      const user = _.clone(defaultUser)
      const created = await state.models.user.upsert(user)
      state.userA = created
      expect(typeof created.id).toBe('number')
      expect(created.createdAt).toBeInstanceOf(Date)
      expect(created.updatedAt).toBeInstanceOf(Date)

      const untouched = _.omit(created, ['id', 'createdAt', 'updatedAt'])
      expect(untouched).toEqual(user)
    })

    it('should create a set of users', async () => {
      const userB = _.assign({}, defaultUser, {firstName: 'John', email: 'john@test.com'})
      const userC = _.assign({}, defaultUser, {firstName: 'Jade', email: 'jade@test.com'})
      const items = await state.models.user.upsertAll([userB, userC])
      expect(items).toHaveLength(2)
      items.forEach((item, index) => {
        const expected = index === 0 ? userB : userC
        expect(typeof item.id).toBe('number')
        expect(item.createdAt).toBeInstanceOf(Date)
        expect(item.updatedAt).toBeInstanceOf(Date)

        const untouched = _.omit(item, ['id', 'createdAt', 'updatedAt'])
        expect(untouched).toEqual(expected)
      })
    })

    it('should update an existing user by id', async () => {
      const user = _.assign({}, state.userA, {email: 'test2@example.com'})
      const item = await state.models.user.upsert(user)
      expect(item).toHaveProperty('email', 'test2@example.com')
      expect(item.updatedAt.getTime()).toBeGreaterThan(state.userA.updatedAt.getTime())

      const untouched = _.omit(item, ['email', 'updatedAt'])
      expect(untouched).toEqual(_.omit(state.userA, ['email', 'updatedAt']))
      state.userA = item
    })

    it('should update an existing user by unique constraints', async () => {
      const user = _.assign({}, state.userA, {age: 24, password: 'other'})
      const item = await state.models.user.upsert(user)
      expect(item).toHaveProperty('age', 24)
      expect(item).toHaveProperty('password', 'other')
      expect(item.updatedAt.getTime()).toBeGreaterThan(state.userA.updatedAt.getTime())

      const untouched = _.omit(item, ['age', 'password', 'updatedAt'])
      expect(untouched).toEqual(_.omit(state.userA, ['age', 'password', 'updatedAt']))
      state.userA = item
    })

    it('should respect last updates to the same record', async () => {
      const users = _.range(10).map(i => _.assign({}, _.omit(state.userA, 'id'), {age: 100 + i}))
      const dbUsers = await state.models.user.upsertAll(users)
      dbUsers.forEach(user => expect(user).toHaveProperty('id', state.userA.id))
      const updated = await state.models.user.findById(state.userA.id)
      expect(updated.age).toBe(109)
    })

    it('should prevent ambiguous updates by unique constraints', async () => {
      const user = _.assign({}, defaultUser, {email: 'test2@example.com', firstName: 'John'})
      await expect(state.models.user.upsert(user)).rejects.toThrow(/conflicting unique/)
    })
  })

  describe('photos', () => {
    it('should create a photo', async () => {
      const metadata = {type: 'jpeg', location: 'United States'}
      const photo = {ownerId: state.userA.id, aspectRatio: 0.67, metadata}
      const item = await state.models.photo.upsert(photo)
      expect(item.id).toMatch(/^\w{8}-\w{4}/)
      expect(item.createdAt).toBeInstanceOf(Date)
      expect(item.updatedAt).toBeInstanceOf(Date)

      const untouched = _.omit(item, ['id', 'createdAt', 'updatedAt'])
      expect(untouched).toEqual(photo)
    })
  })
})
