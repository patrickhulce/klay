const _ = require('lodash')
const Promise = require('bluebird')
const steps = require('./steps')

describesql('patch objects', () => {
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

    it('should update a single field', () => {
      const patch = _.assign(_.pick(shared.userA, 'id'), {email: 'newemail@example.com'})
      return shared.models.user.patch(patch).then(item => {
        item.should.have.property('email', 'newemail@example.com')
        item.should.have.property('updatedAt').instanceof(Date).greaterThan(shared.userA.updatedAt)

        const untouched = _.omit(item, ['updatedAt', 'email'])
        untouched.should.eql(_.omit(shared.userA, ['updatedAt', 'email']))
      })
    })

    it('should update a single field with just id', () => {
      return shared.models.user.patchById(shared.userA.id, {age: '27'}).then(item => {
        item.should.have.property('age', 27)
        item.should.have.property('updatedAt').instanceof(Date).greaterThan(shared.userA.updatedAt)

        const untouched = _.omit(item, ['updatedAt', 'email', 'age'])
        untouched.should.eql(_.omit(shared.userA, ['updatedAt', 'email', 'age']))
      })
    })

    it('should prevent changing immutable properties', () => {
      return shared.models.user.patchById(shared.userA.id, {createdAt: new Date()})
        .should.be.rejectedWith(/immutable.*violated/)
    })

    it('should prevent violating a unique constraint', () => {
      return shared.models.user.patchById(shared.userA.id, {email: 'test2@klay.com'})
        .should.be.rejectedWith(/unique.*violated/)
    })
  })

  describe('photos', () => {
    it('should create a photo', () => {
      const metadata = {type: 'png', gps: 'coords'}
      const photo = {ownerId: shared.userA.id, aspectRatio: 0.66, metadata}
      return shared.models.photo.create(photo).then(item => {
        shared.photoA = item
      })
    })

    it('should patch a photo', () => {
      const metadata = {type: 'jpeg', gps: 'otherr coords'}
      return shared.models.photo.patchById(shared.photoA.id, {metadata}).then(item => {
        item.should.have.property('metadata').eql(metadata)
        item.should.have.property('updatedAt').instanceof(Date).greaterThan(shared.photoA.updatedAt)

        const untouched = _.omit(item, ['updatedAt', 'metadata'])
        untouched.should.eql(_.omit(shared.photoA, ['updatedAt', 'metadata']))
      })
    })
  })
})
