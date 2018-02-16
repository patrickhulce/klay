const _ = require('lodash')
const steps = require('./steps')

describesql('upsert objects', () => {
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
      return shared.models.user.upsert(user).then(item => {
        // eslint-disable-next-line no-multi-assign
        const userA = shared.userA = item
        userA.should.have.property('id').is.a('number')
        userA.should.have.property('createdAt').instanceof(Date)
        userA.should.have.property('updatedAt').instanceof(Date)

        const untouched = _.omit(userA, ['id', 'createdAt', 'updatedAt'])
        untouched.should.eql(user)
      })
    })

    it('should create a set of users', () => {
      const userA = _.assign({}, defaultUser, {firstName: 'John', email: 'john@test.com'})
      const userB = _.assign({}, defaultUser, {firstName: 'Jade', email: 'jade@test.com'})
      return shared.models.user.upsert([userA, userB]).then(items => {
        items.should.have.length(2)
        items.forEach((item, index) => {
          const expected = index === 0 ? userA : userB
          item.should.have.property('id').is.a('number')
          item.should.have.property('createdAt').instanceof(Date)
          item.should.have.property('updatedAt').instanceof(Date)

          const untouched = _.omit(item, ['id', 'createdAt', 'updatedAt'])
          untouched.should.eql(expected)
        })
      })
    })

    it('should update an existing user by id', () => {
      const user = _.assign({}, shared.userA, {email: 'test2@example.com'})
      return shared.models.user.upsert(user).then(item => {
        item.should.have.property('email', 'test2@example.com')
        item.should.have.property('updatedAt').instanceof(Date).greaterThan(shared.userA.updatedAt)

        const untouched = _.omit(item, ['email', 'updatedAt'])
        untouched.should.eql(_.omit(shared.userA, ['email', 'updatedAt']))
        shared.userA = item
      })
    })

    it('should update an existing user by unique constraints', () => {
      const user = _.assign({}, shared.userA, {age: 24, password: 'other'})
      return shared.models.user.upsert(user).then(item => {
        item.should.have.property('age', 24)
        item.should.have.property('password', 'other')
        item.should.have.property('updatedAt').instanceof(Date).greaterThan(shared.userA.updatedAt)

        const untouched = _.omit(item, ['age', 'password', 'updatedAt'])
        untouched.should.eql(_.omit(shared.userA, ['age', 'password', 'updatedAt']))
        shared.userA = item
      })
    })

    it('should respect last updates to the same record', () => {
      const users = _.range(10).map(i => _.assign({}, _.omit(shared.userA, 'id'), {age: 100 + i}))
      return shared.models.user.upsert(users).then(dbUsers => {
        dbUsers.forEach(user => user.should.have.property('id', shared.userA.id))
        return shared.models.user.findById(shared.userA.id)
      }).should.eventually.have.property('age', 109)
    })

    it('should prevent ambiguous updates by unique constraints', () => {
      const user = _.assign({}, defaultUser, {email: 'test2@example.com', firstName: 'Charles'})
      return shared.models.user.upsert(user).should.be.rejectedWith(/ambiguous upsert/)
    })
  })

  describe('photos', () => {
    it('should create a photo', () => {
      const metadata = {type: 'jpeg', location: 'United States'}
      const photo = {ownerId: shared.userA.id, aspectRatio: 0.67, metadata}
      return shared.models.photo.upsert(photo).then(item => {
        item.should.have.property('id').match(/^\w{8}-\w{4}/)
        item.should.have.property('createdAt').instanceof(Date)
        item.should.have.property('updatedAt').instanceof(Date)

        const untouched = _.omit(item, ['id', 'createdAt', 'updatedAt'])
        untouched.should.eql(photo)
      })
    })
  })
})
