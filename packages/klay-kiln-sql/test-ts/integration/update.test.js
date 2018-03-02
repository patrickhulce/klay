const _ = require('lodash')
const utils = require('../utils')

const expect = utils.expect

describe('update objects', () => {
  const state = utils.state()

  utils.steps.cleanAndSync(state)

  describe('users', () => {
    it('should create users', async () => {
      const user = {
        age: 23,
        isAdmin: true,
        email: 'test@klay.com',
        password: 'password',
        firstName: 'Klay',
        lastName: 'Thompson',
      }

      const users = await state.models.user.createAll([
        user,
        _.defaults({firstName: 'klay2', email: 'test2@klay.com'}, user),
      ])

      state.userA = users[0]
      state.userB = users[1]
    })

    it('should update a user', async () => {
      const user = _.assign({}, state.userA, {password: '1234'})
      const updated = await state.models.user.update(user)
      expect(updated).to.have.property('password', '1234')
      expect(updated)
        .to.have.property('updatedAt')
        .instanceof(Date)
        .greaterThan(state.userA.updatedAt)

      const untouched = _.omit(updated, ['updatedAt', 'password'])
      expect(untouched).to.eql(_.omit(user, ['updatedAt', 'password']))
    })

    it('should prevent updating a non-existant record', async () => {
      const user = _.assign({}, state.userA, {id: 1245})
      await expect(state.models.user.update(user)).to.be.rejectedWith(/unable to find/)
    })

    it('should prevent changing immutable properties', async () => {
      const user = _.assign({}, state.userA, {createdAt: new Date()})
      await expect(state.models.user.update(user)).to.be.rejectedWith(/immutable.*violated/)
    })

    it('should prevent violating a unique constraint', async () => {
      const user = _.assign({}, state.userA, {email: 'test2@klay.com'})
      await expect(state.models.user.update(user)).to.be.rejectedWith(/unique.*violated/)
    })
  })

  describe('photos', () => {
    it('should create photos', async () => {
      const metadata = {type: 'png', gps: 'coords'}
      const photoA = {ownerId: state.userA.id, aspectRatio: 0.66, metadata}
      const photoB = {ownerId: state.userA.id, aspectRatio: 2, metadata}
      const photos = await state.models.photo.createAll([photoA, photoB])
      state.photoA = photos[0]
      state.photoB = photos[1]
    })

    it('should update a photo', async () => {
      const metadata = {type: 'jpeg', gps: 'otherr coords'}
      const photo = _.assign({}, state.photoA, {aspectRatio: 2, metadata})
      const updated = await state.models.photo.update(photo)
      expect(updated).to.have.property('aspectRatio', 2)
      expect(updated)
        .to.have.property('metadata')
        .eql(metadata)
      expect(updated)
        .to.have.property('updatedAt')
        .instanceof(Date)
        .greaterThan(photo.updatedAt)

      const untouched = _.omit(updated, ['updatedAt', 'metadata', 'aspectRatio'])
      expect(untouched).to.eql(_.omit(photo, ['updatedAt', 'metadata', 'aspectRatio']))
      state.photoA = updated
    })
  })
})
