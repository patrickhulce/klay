const _ = require('lodash')
const utils = require('../utils')

describe('patch objects', () => {
  const state = utils.state()

  utils.steps.cleanAndSync(state)

  describe('users', () => {
    it('should create users', () => {
      const user = {
        age: 23,
        isAdmin: true,
        email: 'test@klay.com',
        password: 'password',
        firstName: 'klay-core',
        lastName: 'Thompson',
      }

      return Promise.all([
        state.models.user.create(user),
        state.models.user.create(_.defaults({firstName: 'klay2', email: 'test2@klay.com'}, user)),
      ]).then(items => {
        state.userA = items[0]
        state.userB = items[1]
      })
    })

    it('should update a single field', () => {
      const patch = _.assign(_.pick(state.userA, 'id'), {email: 'newemail@example.com'})
      return state.models.user.patch(patch).then(item => {
        expect(item).toHaveProperty('email', 'newemail@example.com')
        expect(item.updatedAt.getTime()).toBeGreaterThan(state.userA.updatedAt.getTime())

        const untouched = _.omit(item, ['updatedAt', 'email'])
        expect(untouched).toEqual(_.omit(state.userA, ['updatedAt', 'email']))
      });
    })

    it('should update a single field with just id', () => {
      return state.models.user.patch(state.userA.id, {age: 27}).then(item => {
        expect(item).toHaveProperty('age', 27)
        expect(item.updatedAt.getTime()).toBeGreaterThan(state.userA.updatedAt.getTime())

        const untouched = _.omit(item, ['updatedAt', 'email', 'age'])
        expect(untouched).toEqual(_.omit(state.userA, ['updatedAt', 'email', 'age']))
      });
    })

    it('should prevent changing immutable properties', () => {
      const promise = state.models.user.patch(state.userA.id, {createdAt: new Date()})
      return expect(promise).rejects.toThrow(/immutable.*violated/)
    })

    it('should prevent violating a unique constraint', () => {
      const promise = state.models.user.patch(state.userA.id, {email: 'test2@klay.com'})
      return expect(promise).rejects.toThrow(/unique.*violated/)
    })
  })

  describe('photos', () => {
    it('should create a photo', () => {
      const metadata = {type: 'png', gps: 'coords'}
      const photo = {ownerId: state.userA.id, aspectRatio: 0.66, metadata}
      return state.models.photo.create(photo).then(item => {
        state.photoA = item
      })
    })

    it('should patch a photo', () => {
      const metadata = {type: 'jpeg', gps: 'otherr coords'}
      return state.models.photo.patch(state.photoA.id, {metadata}).then(item => {
        expect(item)
          .toHaveProperty('metadata', metadata)
          expect(item.updatedAt.getTime()).toBeGreaterThan(state.photoA.updatedAt.getTime())

        const untouched = _.omit(item, ['updatedAt', 'metadata'])
        expect(untouched).toEqual(_.omit(state.photoA, ['updatedAt', 'metadata']))
      });
    })
  })
})
