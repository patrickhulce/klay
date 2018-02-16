/* eslint-disable max-len */
const _ = require('lodash')
const steps = require('./steps')

describesql('atomic transactions', () => {
  const shared = steps.init()

  const defaultUser = {
    age: 23, isAdmin: true,
    email: 'test@klay.com',
    password: 'password',
    firstName: 'Klay',
    lastName: 'Thompson',
  }

  const defaultPhoto = {
    aspectRatio: 0.67,
    metadata: {type: 'jpeg', location: 'United States'},
  }

  it('should rollback creates', () => {
    const user = _.clone(defaultUser)
    return shared.models.user.transaction(transaction => {
      return shared.models.user.create(user, {transaction}).then(item => {
        shared.user = item

        const photo = _.assign({}, defaultPhoto, {ownerId: -1})
        return shared.models.photo.create(photo, {transaction})
      })
    }).then(() => {
      throw new Error('should not have succeeded')
    }).catch(err => {
      err.message.should.not.equal('should not have succeeded')
      return shared.models.user.findById(shared.user.id).should.eventually.be.a('undefined')
    })
  })

  it('should commit creates', () => {
    const user = _.clone(defaultUser)
    return shared.models.user.transaction(transaction => {
      return shared.models.user.create(user, {transaction}).then(item => {
        shared.user = item

        const photo = _.assign({}, defaultPhoto, {ownerId: item.id})
        return shared.models.photo.create(photo, {transaction})
      })
    }).then(photo => {
      shared.photo = photo

      return shared.models.photo.findById(photo.id).then(dbPhoto => {
        photo.should.eql(dbPhoto)
      })
    })
  })

  it('should rollback updates', () => {
    const user = _.assign({}, shared.user, {age: '13'})
    return shared.models.user.transaction(transaction => {
      return shared.models.user.update(user, {transaction}).then(() => {
        const photo = _.assign({}, shared.photo, {aspectRatio: '2'})
        return shared.models.photo.update(photo, {transaction}).then(() => {
          throw new Error('fail!')
        })
      })
    }).then(() => {
      throw new Error('should not have succeeded')
    }).catch(err => {
      err.message.should.equal('fail!')

      return Promise.all([
        shared.models.user.findById(shared.user.id).should.eventually.have.property('age', 23),
        shared.models.photo.findById(shared.photo.id).should.eventually.have.property('aspectRatio', 0.67),
      ])
    })
  })

  it('should commit updates', () => {
    const user = _.assign({}, shared.user, {age: '13'})
    return shared.models.user.transaction(transaction => {
      return shared.models.user.update(user, {transaction}).then(user => {
        const photo = _.assign({}, shared.photo, {aspectRatio: '2'})
        return shared.models.photo.update(photo, {transaction}).then(photo => {
          return [user, photo]
        })
      })
    }).spread((user, photo) => {
      return shared.models.photo.findById(photo.id).then(dbPhoto => {
        dbPhoto.should.have.property('aspectRatio', 2)
        return shared.models.user.findById(user.id)
      }).then(dbUser => {
        dbUser.should.have.property('age', 13)
      })
    })
  })

  it('should rollback patches', () => {
    return shared.models.user.transaction(transaction => {
      return shared.models.user.patchById(shared.user.id, {age: '30'}, {transaction}).then(user => {
        return shared.models.photo.patchById(shared.photo.id, {aspectRatio: '0.5'}, {transaction}).then(photo => {
          return [user, photo]
        })
      }).then(() => {
        throw new Error('fail!')
      })
    }).then(() => {
      throw new Error('should not have succeeded')
    }).catch(err => {
      err.message.should.equal('fail!')

      return Promise.all([
        shared.models.user.findById(shared.user.id).should.eventually.have.property('age', 13),
        shared.models.photo.findById(shared.photo.id).should.eventually.have.property('aspectRatio', 2),
      ])
    })
  })

  it('should commit patches', () => {
    return shared.models.user.transaction(transaction => {
      return shared.models.user.patchById(shared.user.id, {age: '30'}, {transaction}).then(user => {
        return shared.models.photo.patchById(shared.photo.id, {aspectRatio: '0.5'}, {transaction}).then(photo => {
          return [user, photo]
        })
      })
    }).spread((user, photo) => {
      return shared.models.photo.findById(photo.id).then(dbPhoto => {
        dbPhoto.should.have.property('aspectRatio', 0.5)
        return shared.models.user.findById(user.id)
      }).then(dbUser => {
        dbUser.should.have.property('age', 30)
      })
    })
  })

  it('should rollback destroys', () => {
    return shared.models.user.transaction(transaction => {
      return shared.models.photo.destroyById(shared.photo.id, {transaction}).then(() => {
        return shared.models.user.destroyById(shared.user.id, {transaction}).then(() => {
          throw new Error('fail!')
        })
      })
    }).then(() => {
      throw new Error('should not have succeeded')
    }).catch(err => {
      err.message.should.equal('fail!')

      return Promise.all([
        shared.models.user.findById(shared.user.id).should.eventually.have.property('id', shared.user.id),
        shared.models.photo.findById(shared.photo.id).should.eventually.have.property('id', shared.photo.id),
      ])
    })
  })

  it('should commit destroys', () => {
    return shared.models.user.transaction(transaction => {
      return shared.models.photo.destroyById(shared.photo.id, {transaction}).then(() => {
        return shared.models.user.destroyById(shared.user.id, {transaction})
      })
    }).then(() => {
      return Promise.all([
        shared.models.user.findById(shared.user.id).should.eventually.be.a('undefined'),
        shared.models.photo.findById(shared.photo.id).should.eventually.be.a('undefined'),
      ])
    })
  })
})
