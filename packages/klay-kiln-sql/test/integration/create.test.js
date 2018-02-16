/* eslint-disable max-len */
const _ = require('lodash')
const steps = require('./steps')

describesql('create objects', () => {
  const shared = steps.init()

  describe('users', () => {
    const defaultUser = {
      age: 23, isAdmin: true,
      email: 'test@klay.com',
      password: 'password',
      firstName: 'Klay',
      lastName: 'Thompson',
    }

    it('should create a user', () => {
      const user = _.clone(defaultUser)
      return shared.models.user.create(user).then(item => {
        const userA = shared.userA = item // eslint-disable-line no-multi-assign
        userA.should.have.property('id').is.a('number')
        userA.should.have.property('createdAt').instanceof(Date)
        userA.should.have.property('updatedAt').instanceof(Date)

        const untouched = _.omit(userA, ['id', 'createdAt', 'updatedAt'])
        untouched.should.eql(user)
      })
    })

    it('should create a 2nd user', () => {
      const user = _.assign({}, defaultUser, {firstName: 'Klay2', email: 'test2@foobar.com'})
      return shared.models.user.create(user).then(item => {
        item.should.have.property('id').is.a('number').greaterThan(shared.userA.id)
        item.should.have.property('createdAt').instanceof(Date).greaterThan(shared.userA.createdAt)
        item.should.have.property('updatedAt').instanceof(Date).greaterThan(shared.userA.updatedAt)

        const untouched = _.omit(item, ['id', 'createdAt', 'updatedAt'])
        untouched.should.eql(user)
      })
    })

    it('should create a set of users', () => {
      const userA = _.assign({}, defaultUser, {firstName: 'Klay3', email: 'test3@foobar.com'})
      const userB = _.assign({}, defaultUser, {firstName: 'Klay4', email: 'test4@foobar.com'})

      return shared.models.user.create([userA, userB]).then(items => {
        items.should.have.length(2)
        items.forEach((item, index) => {
          item.should.have.property('id').is.a('number').greaterThan(shared.userA.id)
          item.should.have.property('createdAt').instanceof(Date).greaterThan(shared.userA.createdAt)
          item.should.have.property('updatedAt').instanceof(Date).greaterThan(shared.userA.updatedAt)

          const untouched = _.omit(item, ['id', 'createdAt', 'updatedAt'])
          untouched.should.eql(index === 0 ? userA : userB)
        })
      })
    })

    it('should prevent creation of user with same email', () => {
      const user = _.assign({}, defaultUser, {firstName: 'missing'})
      return shared.models.user.create(user).should.be.rejectedWith(/constraint.*email.*violated/)
    })

    it('should prevent creation of user with preset id', () => {
      const user = _.assign({}, defaultUser, {id: 15, firstName: 'missing'})
      return shared.models.user.create(user).should.be.rejectedWith(/expected 15.*undefined/)
    })

    it('should prevent creation of user with invalid values', () => {
      const user = _.assign({}, defaultUser, {age: 'what', firstName: 'missing'})
      return shared.models.user.create(user).should.be.rejectedWith(/must be.*integer/)
    })

    it('should prevent creation of users when one is invalid', () => {
      const userA = _.assign({}, defaultUser, {firstName: 'Klay5', email: 'test5@foobar.com'})
      const userB = _.assign({}, defaultUser, {firstName: 'Klay6', email: 'test4@foobar.com'})
      const userC = _.assign({}, defaultUser, {firstName: 'Klay7', email: 'test6@foobar.com'})
      const promise = shared.models.user.create([userA, userB, userC])
      return promise.should.be.rejectedWith(/constraint.*email.*violated/)
    })

    it('should have prevented creation of other users when one is invalid', () => {
      const where = {firstName: 'Klay5'}
      return shared.models.user.findOne({where}).should.eventually.eql(undefined)
    })
  })

  describe('photos', () => {
    it('should create a photo', () => {
      const metadata = {type: 'jpeg', location: 'United States'}
      const photo = {ownerId: shared.userA.id, aspectRatio: 0.67, metadata}
      return shared.models.photo.create(photo).then(item => {
        item.should.have.property('id').match(/^\w{8}-\w{4}/)
        item.should.have.property('createdAt').instanceof(Date)
        item.should.have.property('updatedAt').instanceof(Date)

        const untouched = _.omit(item, ['id', 'createdAt', 'updatedAt'])
        untouched.should.eql(photo)
      })
    })

    it('should prevent creation of photo with non-existant owner', () => {
      const metadata = {type: 'jpeg', location: 'United States'}
      const photo = {ownerId: -1, aspectRatio: 2, metadata}
      return shared.models.photo.create(photo).should.be.rejectedWith(/foreign key constraint/)
    })
  })
})
