var _ = require('lodash');
var steps = require('./steps');

describesql('update objects', function () {
  var shared = steps.init();

  describe('users', function () {
    it('should create a user', function () {
      var user = {
        age: 23, isAdmin: true,
        email: 'test@klay.com',
        password: 'password',
        firstName: 'Klay',
        lastName: 'Thompson',
      };

      return shared.models.user.create(user).then(function (item) {
        shared.userA = item;
      });
    });

    it('should update a user', function () {
      var user = _.assign({}, shared.userA, {password: '1234'});
      return shared.models.user.update(user).then(function (item) {
        item.should.have.property('password', '1234');
        item.should.have.property('updatedAt').instanceof(Date).greaterThan(shared.userA.updatedAt);

        var untouched = _.omit(item, ['updatedAt', 'password']);
        untouched.should.eql(_.omit(user, ['updatedAt', 'password']));
      });
    });

    it('should prevent updating a non-existant record', function () {
      var user = _.assign({}, shared.userA, {id: 1245});
      return shared.models.user.update(user).should.be.rejectedWith(/no.*primaryKey/);
    });

    it('should prevent changing immutable properties', function () {
      var user = _.assign({}, shared.userA, {createdAt: new Date()});
      return shared.models.user.update(user).should.be.rejectedWith(/immutable.*violated/);
    });
  });

  describe('photos', function () {
    it('should create a photo', function () {
      var metadata = {type: 'png', gps: 'coords'};
      var photo = {ownerId: shared.userA.id, aspectRatio: 0.66, metadata};
      return shared.models.photo.create(photo).then(function (item) {
        shared.photoA = item;
      });
    });

    it('should update a photo', function () {
      var metadata = {type: 'jpeg', gps: 'otherr coords'};
      var photo = _.assign({}, shared.photoA, {aspectRatio: '2', metadata});
      return shared.models.photo.update(photo).then(function (item) {
        item.should.have.property('aspectRatio', 2);
        item.should.have.property('metadata').eql(metadata);
        item.should.have.property('updatedAt').instanceof(Date).greaterThan(shared.photoA.updatedAt);

        var untouched = _.omit(item, ['updatedAt', 'metadata', 'aspectRatio']);
        untouched.should.eql(_.omit(photo, ['updatedAt', 'metadata', 'aspectRatio']));
      });
    });
  });
});
