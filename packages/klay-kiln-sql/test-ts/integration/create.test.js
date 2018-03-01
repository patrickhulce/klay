const chai = require('chai')
const chaiPromise = require('chai-as-promised')
const _ = require('lodash')
const utils = require('../utils')

const expect = chai.expect
chai.use(chaiPromise)

describe('create objects', () => {
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
      const userA = await state.models.user.create(user)
      state.userA = userA
      expect(userA)
        .to.have.property('id')
        .is.a('number')
      expect(userA)
        .to.have.property('createdAt')
        .instanceof(Date)
      expect(userA)
        .to.have.property('updatedAt')
        .instanceof(Date)

      const untouched = _.omit(userA, ['id', 'createdAt', 'updatedAt'])
      expect(untouched).to.eql(user)
    })

    it('should create a 2nd user', async () => {
      const user = _.assign({}, defaultUser, {firstName: 'Klay2', email: 'test2@foobar.com'})
      const userA = await state.models.user.create(user)
      expect(userA)
        .to.have.property('id')
        .is.a('number')
        .greaterThan(state.userA.id)
      expect(userA)
        .to.have.property('createdAt')
        .instanceof(Date)
        .greaterThan(state.userA.createdAt)
      expect(userA)
        .to.have.property('updatedAt')
        .instanceof(Date)
        .greaterThan(state.userA.updatedAt)

      const untouched = _.omit(userA, ['id', 'createdAt', 'updatedAt'])
      expect(untouched).to.eql(user)
    })

    it('should create a set of users', async () => {
      const userA = _.assign({}, defaultUser, {firstName: 'Klay3', email: 'test3@foobar.com'})
      const userB = _.assign({}, defaultUser, {firstName: 'Klay4', email: 'test4@foobar.com'})
      const users = await state.models.user.createAll([userA, userB])

      expect(users).to.have.length(2)
      users.forEach((user, index) => {
        expect(user)
          .to.have.property('id')
          .is.a('number')
          .greaterThan(state.userA.id)
        expect(user)
          .to.have.property('createdAt')
          .instanceof(Date)
          .greaterThan(state.userA.createdAt)
        expect(user)
          .to.have.property('updatedAt')
          .instanceof(Date)
          .greaterThan(state.userA.updatedAt)

        const untouched = _.omit(user, ['id', 'createdAt', 'updatedAt'])
        expect(untouched).to.eql(index === 0 ? userA : userB)
      })
    })

    it('should prevent creation of user with same email', async () => {
      const user = _.assign({}, defaultUser, {firstName: 'missing'})
      await expect(state.models.user.create(user)).to.eventually.be.rejectedWith(
        /constraint.*email.*violated/,
      )
    })

    it('should prevent creation of user with preset id', async () => {
      const user = _.assign({}, defaultUser, {id: 15, firstName: 'missing'})
      await expect(state.models.user.create(user)).to.be.rejectedWith(/expected.*undefined/)
    })

    it('should prevent creation of user with invalid values', async () => {
      const user = _.assign({}, defaultUser, {age: 'what', firstName: 'missing'})
      await expect(state.models.user.create(user)).to.be.rejectedWith(/expected.*number/)
    })

    it('should prevent creation of users when one is invalid', async () => {
      const userA = _.assign({}, defaultUser, {firstName: 'Klay5', email: 'test5@foobar.com'})
      const userB = _.assign({}, defaultUser, {firstName: 'Klay6', email: 'test4@foobar.com'})
      const userC = _.assign({}, defaultUser, {firstName: 'Klay7', email: 'test6@foobar.com'})
      const promise = state.models.user.createAll([userA, userB, userC])
      await expect(promise).to.be.rejectedWith(/constraint.*email.*violated/)
    })

    it('should have prevented creation of other users when one is invalid', async () => {
      const where = {firstName: 'Klay5'}
      await expect(state.models.user.findOne({where})).to.eventually.eql(undefined)
    })
  })

  describe('photos', () => {
    it('should create a photo', () => {
      const metadata = {type: 'jpeg', location: 'United States'}
      const photo = {ownerId: state.userA.id, aspectRatio: 0.67, metadata}
      return state.models.photo.create(photo).then(item => {
        expect(item)
          .to.have.property('id')
          .match(/^\w{8}-\w{4}/)
        expect(item)
          .to.have.property('createdAt')
          .instanceof(Date)
        expect(item)
          .to.have.property('updatedAt')
          .instanceof(Date)

        const untouched = _.omit(item, ['id', 'createdAt', 'updatedAt'])
        expect(untouched).to.eql(photo)
      })
    })

    it('should prevent creation of photo with non-existant owner', async () => {
      const metadata = {type: 'jpeg', location: 'United States'}
      const photo = {ownerId: -1, aspectRatio: 2, metadata}
      await expect(state.models.photo.create(photo)).to.be.rejectedWith(/foreign key constraint/)
    })
  })
})
