const _ = require('lodash')
const utils = require('../utils')

const expect = utils.expect

describe('upsert objects', () => {
  const state = utils.state()

  utils.steps.cleanAndSync(state)

  describe('users', () => {
    const defaultUser = {
      age: 23,
      isAdmin: true,
      email: 'test@klay.com',
      password: 'password',
      firstName: 'Klay',
      lastName: 'Thompson',
    }

    it('should create a user', async () => {
      const user = _.clone(defaultUser)
      const created = await state.models.user.upsert(user)
      state.userA = created
      expect(created).to.have.property('id').is.a('number')
      expect(created).to.have.property('createdAt').instanceof(Date)
      expect(created).to.have.property('updatedAt').instanceof(Date)

      const untouched = _.omit(created, ['id', 'createdAt', 'updatedAt'])
      expect(untouched).to.eql(user)
    })

    it('should create a set of users', async () => {
      const userB = _.assign({}, defaultUser, {firstName: 'John', email: 'john@test.com'})
      const userC = _.assign({}, defaultUser, {firstName: 'Jade', email: 'jade@test.com'})
      const items = await state.models.user.upsertAll([userB, userC])
      expect(items).to.have.length(2)
      items.forEach((item, index) => {
        const expected = index === 0 ? userB : userC
        expect(item).to.have.property('id').is.a('number')
        expect(item).to.have.property('createdAt').instanceof(Date)
        expect(item).to.have.property('updatedAt').instanceof(Date)

        const untouched = _.omit(item, ['id', 'createdAt', 'updatedAt'])
        expect(untouched).to.eql(expected)
      })
    })

    it('should update an existing user by id', async () => {
      const user = _.assign({}, state.userA, {email: 'test2@example.com'})
      const item = await state.models.user.upsert(user)
      expect(item).to.have.property('email', 'test2@example.com')
      expect(item).to.have
        .property('updatedAt')
        .instanceof(Date)
        .greaterThan(state.userA.updatedAt)

      const untouched = _.omit(item, ['email', 'updatedAt'])
      expect(untouched).to.eql(_.omit(state.userA, ['email', 'updatedAt']))
      state.userA = item
    })

    it('should update an existing user by unique constraints', async () => {
      const user = _.assign({}, state.userA, {age: 24, password: 'other'})
      const item = await state.models.user.upsert(user)
      expect(item).to.have.property('age', 24)
      expect(item).to.have.property('password', 'other')
      expect(item).to.have
        .property('updatedAt')
        .instanceof(Date)
        .greaterThan(state.userA.updatedAt)

      const untouched = _.omit(item, ['age', 'password', 'updatedAt'])
      expect(untouched).to.eql(_.omit(state.userA, ['age', 'password', 'updatedAt']))
      state.userA = item
    })

    it('should respect last updates to the same record', async () => {
      const users = _.range(10).map(i => _.assign({}, _.omit(state.userA, 'id'), {age: 100 + i}))
      const dbUsers = await state.models.user.upsertAll(users)
      dbUsers.forEach(user => expect(user).to.have.property('id', state.userA.id))
      const updated = await state.models.user.findById(state.userA.id)
      expect(updated.age).to.equal(109)
    })

    it('should prevent ambiguous updates by unique constraints', async () => {
      const user = _.assign({}, defaultUser, {email: 'test2@example.com', firstName: 'John'})
      await expect(state.models.user.upsert(user)).to.be.rejectedWith(/conflicting unique/)
    })
  })

  describe('photos', () => {
    it('should create a photo', async () => {
      const metadata = {type: 'jpeg', location: 'United States'}
      const photo = {ownerId: state.userA.id, aspectRatio: 0.67, metadata}
      const item = await state.models.photo.upsert(photo)
      expect(item).to.have.property('id').match(/^\w{8}-\w{4}/)
      expect(item).to.have.property('createdAt').instanceof(Date)
      expect(item).to.have.property('updatedAt').instanceof(Date)

      const untouched = _.omit(item, ['id', 'createdAt', 'updatedAt'])
      expect(untouched).to.eql(photo)
    })
  })
})
