const _ = require('lodash')
const utils = require('../utils')

describe('create objects', () => {
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
      const userA = await state.models.user.create(user)
      state.userA = userA
      expect(typeof userA.id).toBe('number')
      expect(userA.createdAt).toBeInstanceOf(Date)
      expect(userA.updatedAt).toBeInstanceOf(Date)

      const untouched = _.omit(userA, ['id', 'createdAt', 'updatedAt'])
      expect(untouched).toEqual(user)
    })

    it('should create a 2nd user', async () => {
      const user = _.assign({}, defaultUser, {firstName: 'Klay2', email: 'test2@foobar.com'})
      const userB = await state.models.user.create(user)
      expect(userB.id).toBeGreaterThan(state.userA.id)

      expect(userB.createdAt).toBeInstanceOf(Date)
      expect(userB.updatedAt).toBeInstanceOf(Date)
      expect(userB.createdAt.getTime()).toBeGreaterThan(state.userA.createdAt.getTime())
      expect(userB.updatedAt.getTime()).toBeGreaterThan(state.userA.updatedAt.getTime())

      const untouched = _.omit(userB, ['id', 'createdAt', 'updatedAt'])
      expect(untouched).toEqual(user)
    })

    it('should create a set of users', async () => {
      const userA = _.assign({}, defaultUser, {firstName: 'Klay3', email: 'test3@foobar.com'})
      const userB = _.assign({}, defaultUser, {firstName: 'Klay4', email: 'test4@foobar.com'})
      const users = await state.models.user.createAll([userA, userB])

      expect(users).toHaveLength(2)
      users.forEach((user, index) => {
        expect(user.id).toBeGreaterThan(state.userA.id)
        expect(user.createdAt.getTime()).toBeGreaterThan(state.userA.createdAt.getTime())
        expect(user.updatedAt.getTime()).toBeGreaterThan(state.userA.updatedAt.getTime())

        const untouched = _.omit(user, ['id', 'createdAt', 'updatedAt'])
        expect(untouched).toEqual(index === 0 ? userA : userB)
      })
    })

    it('should prevent creation of user with same email', async () => {
      const user = _.assign({}, defaultUser, {firstName: 'missing'})
      await expect(state.models.user.create(user)).rejects.toThrow(/constraint.*email.*violated/)
    })

    it('should prevent creation of user with preset id', async () => {
      const user = _.assign({}, defaultUser, {id: 15, firstName: 'missing'})
      await expect(state.models.user.create(user)).rejects.toThrow('value failed validation')
    })

    it('should prevent creation of user with invalid values', async () => {
      const user = _.assign({}, defaultUser, {age: 'what', firstName: 'missing'})
      await expect(state.models.user.create(user)).rejects.toThrow('value failed validation')
    })

    it('should prevent creation of users when one is invalid', async () => {
      const userA = _.assign({}, defaultUser, {firstName: 'Klay5', email: 'test5@foobar.com'})
      const userB = _.assign({}, defaultUser, {firstName: 'Klay6', email: 'test4@foobar.com'})
      const userC = _.assign({}, defaultUser, {firstName: 'Klay7', email: 'test6@foobar.com'})
      const promise = state.models.user.createAll([userA, userB, userC])
      await expect(promise).rejects.toThrow(/constraint.*email.*violated/)
    })

    it('should have prevented creation of other users when one is invalid', async () => {
      const where = {firstName: 'Klay5'}
      expect(await state.models.user.findOne({where})).toEqual(undefined)
    })
  })

  describe('photos', () => {
    it('should create a photo', () => {
      const metadata = {type: 'jpeg', location: 'United States'}
      const photo = {ownerId: state.userA.id, aspectRatio: 0.67, metadata}
      return state.models.photo.create(photo).then(item => {
        expect(item.id).toMatch(/^\w{8}-\w{4}/)
        expect(item.createdAt).toBeInstanceOf(Date)
        expect(item.updatedAt).toBeInstanceOf(Date)

        const untouched = _.omit(item, ['id', 'createdAt', 'updatedAt'])
        expect(untouched).toEqual(photo)
      })
    })

    it('should prevent creation of photo with non-existant owner', async () => {
      const metadata = {type: 'jpeg', location: 'United States'}
      const photo = {ownerId: -1, aspectRatio: 2, metadata}
      await expect(state.models.photo.create(photo)).rejects.toThrow(/foreign key constraint/)
    })
  })
})
