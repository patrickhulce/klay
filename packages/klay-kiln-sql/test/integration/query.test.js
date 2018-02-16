const _ = require('lodash')
const steps = require('./steps')

describesql('query objects', () => {
  const shared = steps.init()
  let userModel, photoModel

  beforeEach(() => {
    userModel = _.get(shared, 'models.user')
    photoModel = _.get(shared, 'models.photo')
  })

  steps.insertData(shared)

  describe('find', () => {
    it('should find users based on filters', () => {
      return userModel.find({
        order: [['age', 'desc']],
        where: {age: {$gte: 21}, isAdmin: false},
      }).then(items => {
        items.should.have.length(3)
        items[0].should.have.property('email', 'jack.doe@example.com')
        items[1].should.have.property('email', 'smith@example.com')
        items[2].should.have.property('email', 'jill.doe@example.com')
      })
    })

    it('should find users based on more filters', () => {
      return userModel.find({
        limit: 2, offset: 1,
        order: [['age', 'asc']],
        where: {lastName: {$ne: 'Smith'}},
      }).then(items => {
        items.should.have.length(2)
        items[0].should.have.property('email', 'jill.doe@example.com')
        items[1].should.have.property('email', 'jack.doe@example.com')
      })
    })

    it('should find photos', () => {
      return photoModel.find({order: [['aspectRatio', 'asc']]}).then(items => {
        items.should.have.length(7)
        items[0].should.have.property('metadata').eql({type: 'psd', width: 200, height: 300})
      })
    })
  })

  describe('findOne', () => {
    it('should find a single user', () => {
      return userModel.findOne({where: {email: 'smith@example.com'}}).then(item => {
        item.should.have.property('lastName', 'Smith')
        item.should.have.property('email', 'smith@example.com')
      })
    })
  })

  describe('findById', () => {
    it('should find a single user by id', () => {
      return userModel.findOne({where: {email: 'smith@example.com'}}).then(itemA => {
        return userModel.findById(itemA.id).then(itemB => {
          itemA.should.eql(itemB)
        })
      })
    })

    it('should find a single photo by id', () => {
      return photoModel.findOne({where: {aspectRatio: 0.66}}).then(itemA => {
        return photoModel.findById(itemA.id).then(itemB => {
          itemA.should.eql(itemB)
        })
      })
    })
  })

  describe('count', () => {
    it('should count number of photos', () => {
      return photoModel.count({where: {aspectRatio: {$gt: 1}}}).should.eventually.eql(4)
    })
  })

  describe('queryBuilder', () => {
    it('should filter', () => {
      return userModel.queryBuilder()
        .where('firstName', 'Jill')
        .fetchResult()
        .should.eventually.have.property('email', 'jill.doe@example.com')
    })

    it('should sort', () => {
      return userModel.queryBuilder()
        .orderBy([['email', 'desc']])
        .fetchResult()
        .should.eventually.have.property('email', 'smith@example.com')
    })

    it('should limit the number of records returned', () => {
      return userModel.queryBuilder()
        .limit(3)
        .fetchResults()
        .should.eventually.have.length(3)
    })

    it('should skip the requested number of records', () => {
      return userModel.queryBuilder()
        .offset(3)
        .fetchResults()
        .should.eventually.have.length(3)
    })

    it('should limit the fields returned', () => {
      return userModel.queryBuilder()
        .where('email', 'john.doe@example.com')
        .fields(['firstName', 'lastName'])
        .fetchResult()
        .should.eventually.eql({firstName: 'John', lastName: 'Doe'})
    })

    it('should fetch the count', () => {
      return userModel.queryBuilder()
        .where('firstName', 'John')
        .where('lastName', 'Doe')
        .where('isAdmin', true)
        .fields(['firstName', 'lastName'])
        .fetchCount()
        .should.eventually.eql(1)
    })
  })
})
