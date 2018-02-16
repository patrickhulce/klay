const _ = require('lodash')
const steps = require('./steps')

describesql('destroy objects', () => {
  const shared = steps.init()
  let userModel, photoModel

  beforeEach(() => {
    userModel = _.get(shared, 'models.user')
    photoModel = _.get(shared, 'models.photo')
  })

  steps.insertData(shared)

  describe('destroy', () => {
    it('should destroy users based on filters', () => {
      return userModel.destroy({isAdmin: true}).then(() => {
        return userModel.find({where: {isAdmin: true}}).should.eventually.have.length(0)
      })
    })

    it('should destroy users based on other filters', () => {
      return userModel.destroy({lastName: 'Smith'}).then(() => {
        return userModel.find().should.eventually.have.length(3)
      })
    })

    it('should have destroyed photos on cascade', () => {
      return photoModel.count().should.eventually.be.lessThan(7)
    })
  })

  describe('destroyOne', () => {
    steps.cleanAndSync(shared)
    steps.insertData(shared)

    it('should destroy a single user', () => {
      return userModel.destroyOne({lastName: 'Doe'}).then(() => {
        return userModel.find({where: {lastName: 'Doe'}}).should.eventually.have.length(4)
      })
    })
  })

  describe('destroyById', () => {
    it('should destroy a single photo by id', () => {
      return photoModel.findOne().then(photo => {
        return photoModel.destroyById(photo.id).then(() => {
          return photoModel.findById(photo.id).should.eventually.be.a('undefined')
        })
      })
    })
  })
})
