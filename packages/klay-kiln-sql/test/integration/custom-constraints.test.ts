const _ = require('lodash')
const utils = require('../utils')

describe('complex constraints', () => {
  const ageError = 'users can only get older'
  const youngerError = 'new users must be younger than existing population'
  const lastNameError = 'cannot have more than 2 people with same lastName'

  const state = utils.state()

  utils.steps.cleanAndSync(state, models => {
    models.user = models.user
      .constrain({
        type: 'custom',
        meta: {
          async evaluate(context) {
            const {existing, record, executor} = context
            if (existing && record.age < existing.age) {
              throw new Error(ageError)
            } else if (!existing) {
              const users = await executor.find({where: {age: {$lt: record.age}}})
              if (users.length > 0) {
                throw new Error(youngerError)
              }
            }
          },
        },
      })
      .constrain({
        type: 'custom',
        meta: {
          async evaluate(context) {
            const {existing, record, executor} = context
            if (existing && record.lastName === existing.lastName) {
              return
            }

            const users = await executor.find({where: {lastName: record.lastName}})
            if (users.length >= 2) {
              throw new Error(lastNameError)
            }
          },
        },
      })
  })

  describe('users', () => {
    const defaultUser = {
      age: 23,
      isAdmin: true,
      email: 'test@klay.com',
      password: 'password',
      firstName: 'klay-core',
      lastName: 'Thompson',
    }

    it('should create a Thompson user', () => {
      const user = _.assign({}, defaultUser, {age: 50})
      return state.models.user.create(user).then(record => state.userA = record)
    })

    it('should create a non-Thompson user', () => {
      const user = _.assign({}, defaultUser, {email: 'a@b.com', lastName: 'Johnson', age: 49})
      return state.models.user.create(user).then(record => state.userB = record)
    })

    it('should fail to create an older user', () => {
      const user = _.assign({}, defaultUser, {email: 'b@c.com', firstName: 'Kris', age: 70})
      return expect(state.models.user.create(user)).rejects.toThrow(youngerError)
    })

    it('should create another Thompson user', () => {
      const user = _.assign({}, defaultUser, {email: 'c@d.com', firstName: 'Kim', age: 42})
      return state.models.user.create(user).then(record => state.userC = record)
    })

    it('should fail to create another Thompson user', () => {
      const user = _.assign({}, defaultUser, {email: 'd@e.com', firstName: 'Kanye', age: 40})
      return expect(state.models.user.create(user)).rejects.toThrow(lastNameError)
    })

    it('should update a Thompson user\'s firstName and age', () => {
      const user = _.assign({}, state.userA, {firstName: 'Bill', age: 55})
      return state.models.user.update(user)
    })

    it('should fail to update a non-Thompson user to a Thompson', () => {
      const user = _.assign({}, state.userB, {firstName: 'JJ', lastName: 'Thompson'})
      return expect(state.models.user.update(user)).rejects.toThrow(lastNameError)
    })

    it('should fail to make a user younger', () => {
      const user = _.assign({}, state.userC, {age: 20})
      return expect(state.models.user.update(user)).rejects.toThrow(ageError)
    })
  })
})
