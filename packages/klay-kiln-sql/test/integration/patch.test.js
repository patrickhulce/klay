const _ = require('lodash')
const utils = require('../utils')

const expect = utils.expect

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
        firstName: 'Klay',
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
        expect(item).to.have.property('email', 'newemail@example.com')
        expect(item)
          .to.have.property('updatedAt')
          .instanceof(Date)
          .greaterThan(state.userA.updatedAt)

        const untouched = _.omit(item, ['updatedAt', 'email'])
        expect(untouched).to.eql(_.omit(state.userA, ['updatedAt', 'email']))
      })
    })

    it('should update a single field with just id', () => {
      return state.models.user.patch(state.userA.id, {age: 27}).then(item => {
        expect(item).to.have.property('age', 27)
        expect(item)
          .to.have.property('updatedAt')
          .instanceof(Date)
          .greaterThan(state.userA.updatedAt)

        const untouched = _.omit(item, ['updatedAt', 'email', 'age'])
        expect(untouched).to.eql(_.omit(state.userA, ['updatedAt', 'email', 'age']))
      })
    })

    it('should prevent changing immutable properties', () => {
      const promise = state.models.user.patch(state.userA.id, {createdAt: new Date()})
      return expect(promise).to.be.rejectedWith(/immutable.*violated/)
    })

    it('should prevent violating a unique constraint', () => {
      const promise = state.models.user.patch(state.userA.id, {email: 'test2@klay.com'})
      return expect(promise).to.be.rejectedWith(/unique.*violated/)
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
          .to.have.property('metadata')
          .eql(metadata)
        expect(item)
          .to.have.property('updatedAt')
          .instanceof(Date)
          .greaterThan(state.photoA.updatedAt)

        const untouched = _.omit(item, ['updatedAt', 'metadata'])
        expect(untouched).to.eql(_.omit(state.photoA, ['updatedAt', 'metadata']))
      })
    })
  })
})
