var _ = require('lodash');
var steps = require('./steps');

describesql('query objects', function () {
  var shared = steps.init();
  var userModel, photoModel;

  beforeEach(function () {
    userModel = _.get(shared, 'models.user');
    photoModel = _.get(shared, 'models.photo');
  });

  steps.insertData(shared);

  describe('find', function () {
    it('should find users based on filters', function () {
      return userModel.find({
        order: [['age', 'desc']],
        where: {age: {$gte: 21}, isAdmin: false},
      }).then(function (items) {
        items.should.have.length(3);
        items[0].should.have.property('email', 'jack.doe@example.com');
        items[1].should.have.property('email', 'smith@example.com');
        items[2].should.have.property('email', 'jill.doe@example.com');
      });
    });

    it('should find users based on more filters', function () {
      return userModel.find({
        limit: 2, offset: 1,
        order: [['age', 'asc']],
        where: {lastName: {$ne: 'Smith'}},
      }).then(function (items) {
        items.should.have.length(2);
        items[0].should.have.property('email', 'jill.doe@example.com');
        items[1].should.have.property('email', 'jack.doe@example.com');
      });
    });

    it('should find photos', function () {
      return photoModel.find({order: [['aspectRatio', 'asc']]}).then(function (items) {
        items.should.have.length(7);
        items[0].should.have.property('metadata').eql({type: 'psd', width: 200, height: 300});
      });
    });
  });

  describe('findOne', function () {
    it('should find a single user', function () {
      return userModel.findOne({where: {email: 'smith@example.com'}}).then(function (item) {
        item.should.have.property('lastName', 'Smith');
        item.should.have.property('email', 'smith@example.com');
      });
    });
  });

  describe('findById', function () {
    it('should find a single user by id', function () {
      return userModel.findOne({where: {email: 'smith@example.com'}}).then(function (itemA) {
        return userModel.findById(itemA.id).then(function (itemB) {
          itemA.should.eql(itemB);
        });
      });
    });

    it('should find a single photo by id', function () {
      return photoModel.findOne({where: {aspectRatio: 0.66}}).then(function (itemA) {
        return photoModel.findById(itemA.id).then(function (itemB) {
          itemA.should.eql(itemB);
        });
      });
    });
  });

  describe('count', function () {
    it('should count number of photos', function () {
      return photoModel.count({where: {aspectRatio: {$gt: 1}}}).should.eventually.eql(4);
    });
  });

  describe('queryBuilder', function () {
    it('should filter', function () {
      return userModel.queryBuilder().
        where('firstName', 'Jill').
        fetchResult().
        should.eventually.have.property('email', 'jill.doe@example.com');
    });

    it('should sort', function () {
      return userModel.queryBuilder().
        orderBy([['email', 'desc']]).
        fetchResult().
        should.eventually.have.property('email', 'smith@example.com');
    });

    it('should limit the number of records returned', function () {
      return userModel.queryBuilder().
        limit(3).
        fetchResults().
        should.eventually.have.length(3);
    });

    it('should skip the requested number of records', function () {
      return userModel.queryBuilder().
        offset(3).
        fetchResults().
        should.eventually.have.length(3);
    });

    it('should limit the fields returned', function () {
      return userModel.queryBuilder().
        where('email', 'john.doe@example.com').
        fields(['firstName', 'lastName']).
        fetchResult().
        should.eventually.eql({firstName: 'John', lastName: 'Doe'});
    });

    it('should fetch the count', function () {
      return userModel.queryBuilder().
        where('firstName', 'John').
        where('lastName', 'Doe').
        where('isAdmin', true).
        fields(['firstName', 'lastName']).
        fetchCount().
        should.eventually.eql(1);
    });
  });
});
