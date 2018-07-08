const _ = require('lodash')
const utils = require('../utils')

describe('atomic transactions', () => {
  const state = utils.state()

  utils.steps.cleanAndSync(state)

  const defaultUser = {
    age: 23,
    isAdmin: true,
    email: 'test@klay.com',
    password: 'password',
    firstName: 'klay-core',
    lastName: 'Thompson',
  }

  const defaultPhoto = {
    aspectRatio: 0.67,
    metadata: {type: 'jpeg', location: 'United States'},
  }

  it('should rollback creates', async () => {
    const user = _.clone(defaultUser)
    try {
      await state.models.user.transaction(async transaction => {
        state.user = await state.models.user.create(user, {transaction})
        const photo = _.assign({}, defaultPhoto, {ownerId: -1})
        await state.models.photo.create(photo, {transaction})
      })

      throw new Error('Transaction should have failed')
    } catch (err) {
      expect(err.message).toMatch(/foreign key constraint/)
      const dbUser = await state.models.user.findById(state.user.id)
      expect(dbUser).toBe(null)
    }
  })

  it('should commit creates', async () => {
    const user = _.clone(defaultUser)
    await state.models.user.transaction(async transaction => {
      state.user = await state.models.user.create(user, {transaction})
      const photo = _.assign({}, defaultPhoto, {ownerId: state.user.id})
      state.photo = await state.models.photo.create(photo, {transaction})
    })

    const dbUser = await state.models.user.findById(state.user.id)
    const dbPhoto = await state.models.photo.findById(state.photo.id)
    expect(dbUser).toEqual(state.user)
    expect(dbPhoto).toEqual(state.photo)
  })

  it('should rollback updates', async () => {
    const user = _.assign({}, state.user, {age: 13})
    try {
      await state.models.user.transaction(transaction => {
        return state.models.user.update(user, {transaction}).then(() => {
          const photo = _.assign({}, state.photo, {aspectRatio: 2})
          return state.models.photo.update(photo, {transaction}).then(() => {
            throw new Error('fail')
          })
        })
      })
    } catch (err) {
      expect(err.message).toBe('fail')
    }

    const dbUser = await state.models.user.findById(state.user.id)
    const dbPhoto = await state.models.photo.findById(state.photo.id)
    expect(dbUser.age).toBe(23)
    expect(dbPhoto.aspectRatio).toBe(0.67)
  })

  it('should commit updates', () => {
    const user = _.assign({}, state.user, {age: 13})
    return state.models.user
      .transaction(transaction => {
        return state.models.user.update(user, {transaction}).then(user => {
          const photo = _.assign({}, state.photo, {aspectRatio: 2})
          return state.models.photo.update(photo, {transaction}).then(photo => {
            return [user, photo]
          })
        })
      })
      .then(([user, photo]) => {
        return state.models.photo
          .findById(photo.id)
          .then(dbPhoto => {
            expect(dbPhoto).toHaveProperty('aspectRatio', 2)
            return state.models.user.findById(user.id)
          })
          .then(dbUser => {
            expect(dbUser).toHaveProperty('age', 13)
          })
      })
  })

  it('should rollback patches', () => {
    return state.models.user
      .transaction(transaction => {
        return state.models.user
          .patch(state.user.id, {age: 30}, {transaction})
          .then(user => {
            return state.models.photo
              .patch(state.photo.id, {aspectRatio: 0.5}, {transaction})
              .then(photo => {
                return [user, photo]
              })
          })
          .then(() => {
            throw new Error('fail!')
          })
      })
      .then(() => {
        throw new Error('should not have succeeded')
      })
      .catch(async err => {
        expect(err.message).toBe('fail!')

        expect(await state.models.user.findById(state.user.id)).toHaveProperty('age', 13)
        expect(await state.models.photo.findById(state.photo.id)).toHaveProperty('aspectRatio', 2)
      })
  })

  it('should commit patches', () => {
    return state.models.user
      .transaction(transaction => {
        return state.models.user.patch(state.user.id, {age: 30}, {transaction}).then(user => {
          return state.models.photo
            .patch(state.photo.id, {aspectRatio: 0.5}, {transaction})
            .then(photo => {
              return [user, photo]
            })
        })
      })
      .then(([user, photo]) => {
        return state.models.photo
          .findById(photo.id)
          .then(dbPhoto => {
            expect(dbPhoto).toHaveProperty('aspectRatio', 0.5)
            return state.models.user.findById(user.id)
          })
          .then(dbUser => {
            expect(dbUser).toHaveProperty('age', 30)
          })
      })
  })

  it('should rollback destroys', () => {
    return state.models.user
      .transaction(transaction => {
        return state.models.photo.destroyById(state.photo.id, {transaction}).then(() => {
          return state.models.user.destroyById(state.user.id, {transaction}).then(() => {
            throw new Error('fail!')
          })
        })
      })
      .then(() => {
        throw new Error('should not have succeeded')
      })
      .catch(async err => {
        expect(err.message).toBe('fail!')

        expect(await state.models.user.findById(state.user.id)).toHaveProperty('id', state.user.id)
        expect(await state.models.photo.findById(state.photo.id)).toHaveProperty(
          'id',
          state.photo.id,
        )
      })
  })

  it('should commit destroys', () => {
    return state.models.user
      .transaction(transaction => {
        return state.models.photo.destroyById(state.photo.id, {transaction}).then(() => {
          return state.models.user.destroyById(state.user.id, {transaction})
        })
      })
      .then(async () => {
        expect(await state.models.user.findById(state.user.id)).toBe(null)
        expect(await state.models.photo.findById(state.photo.id)).toBe(null)
      })
  })
})
