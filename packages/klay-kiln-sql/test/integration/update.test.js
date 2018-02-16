const _ = require('lodash')
const Promise = require('bluebird')
const steps = require('./steps')

describesql('update objects', () => {
  const shared = steps.init()

  describe('users', () => {
    it('should create users', () => {
      const user = {
        age: 23, isAdmin: true,
        email: 'test@klay.com',
        password: 'password',
        firstName: 'Klay',
        lastName: 'Thompson',
      }

      return Promise.all([
        shared.models.user.create(user),
        shared.models.user.create(_.defaults({firstName: 'klay2', email: 'test2@klay.com'}, user)),
      ]).then(items => {
        shared.userA = items[0]
        shared.userB = items[1]
      })
    })

    it('should update a user', () => {
      const user = _.assign({}, shared.userA, {password: '1234'})
      return shared.models.user.update(user).then(item => {
        item.should.have.property('password', '1234')
        item.should.have.property('updatedAt').instanceof(Date).greaterThan(shared.userA.updatedAt)

        const untouched = _.omit(item, ['updatedAt', 'password'])
        untouched.should.eql(_.omit(user, ['updatedAt', 'password']))
      })
    })

    it('should prevent updating a non-existant record', () => {
      const user = _.assign({}, shared.userA, {id: 1245})
      return shared.models.user.update(user).should.be.rejectedWith(/no.*primaryKey/)
    })

    it('should prevent changing immutable properties', () => {
      const user = _.assign({}, shared.userA, {createdAt: new Date()})
      return shared.models.user.update(user).should.be.rejectedWith(/immutable.*violated/)
    })

    it('should prevent violating a unique constraint', () => {
      const user = _.assign({}, shared.userA, {email: 'test2@klay.com'})
      return shared.models.user.update(user).should.be.rejectedWith(/unique.*violated/)
    })
  })

  describe('photos', () => {
    it('should create photos', () => {
      const metadata = {type: 'png', gps: 'coords'}
      const photoA = {ownerId: shared.userA.id, aspectRatio: 0.66, metadata}
      const photoB = {ownerId: shared.userA.id, aspectRatio: 2, metadata}
      return shared.models.photo.create([photoA, photoB]).then(items => {
        shared.photoA = items[0]
        shared.photoB = items[1]
      })
    })

    it('should update a photo', () => {
      const metadata = {type: 'jpeg', gps: 'otherr coords'}
      const photo = _.assign({}, shared.photoA, {aspectRatio: '2', metadata})
      return shared.models.photo.update(photo).then(item => {
        item.should.have.property('aspectRatio', 2)
        item.should.have.property('metadata').eql(metadata)
        item.should.have.property('updatedAt').instanceof(Date).greaterThan(photo.updatedAt)

        const untouched = _.omit(item, ['updatedAt', 'metadata', 'aspectRatio'])
        untouched.should.eql(_.omit(photo, ['updatedAt', 'metadata', 'aspectRatio']))
        shared.photoA = item
      })
    })

    it('should update multiple photos', () => {
      const metadata = {type: 'jpeg', gps: 'otherr coords'}
      const photoA = _.assign({}, shared.photoA, {aspectRatio: '1', metadata})
      const photoB = _.assign({}, shared.photoB, {aspectRatio: '.5', metadata})
      return shared.models.photo.update([photoA, photoB]).then(items => {
        items.forEach((item, index) => {
          const expected = index === 0 ? photoA : photoB
          item.should.have.property('aspectRatio', Number(expected.aspectRatio))
          item.should.have.property('metadata').eql(expected.metadata)
          item.should.have.property('updatedAt').instanceof(Date).greaterThan(expected.updatedAt)

          const untouched = _.omit(item, ['updatedAt', 'metadata', 'aspectRatio'])
          untouched.should.eql(_.omit(expected, ['updatedAt', 'metadata', 'aspectRatio']))
        })
      })
    })
  })
})
