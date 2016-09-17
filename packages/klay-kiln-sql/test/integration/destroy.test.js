var _ = require('lodash');
var steps = require('./steps');

describesql('destroy objects', function () {
  var shared = steps.init();
  var userModel, photoModel;

  beforeEach(function () {
    userModel = _.get(shared, 'models.user');
    photoModel = _.get(shared, 'models.photo');
  });

  steps.insertData(shared);

  describe('destroy', function () {
    it('should destroy users based on filters', function () {
      return userModel.destroy({isAdmin: true}).then(function () {
        return userModel.find({where: {isAdmin: true}}).should.eventually.have.length(0);
      });
    });

    it('should destroy users based on other filters', function () {
      return userModel.destroy({lastName: 'Smith'}).then(function () {
        return userModel.find().should.eventually.have.length(3);
      });
    });

    it('should have destroyed photos on cascade', function () {
      return photoModel.count().should.eventually.be.lessThan(7);
    });
  });


  describe('destroyOne', function () {
    steps.cleanAndSync(shared);
    steps.insertData(shared);

    it('should destroy a single user', function () {
      return userModel.destroyOne({lastName: 'Doe'}).then(function () {
        return userModel.find({where: {lastName: 'Doe'}}).should.eventually.have.length(4);
      });
    });
  });

  describe('destroyById', function () {
    it('should destroy a single photo by id', function () {
      return photoModel.findOne().then(function (photo) {
        return photoModel.destroyById(photo.id).then(function () {
          return photoModel.findById(photo.id).should.eventually.be.a('undefined');
        });
      });
    });
  });
});
