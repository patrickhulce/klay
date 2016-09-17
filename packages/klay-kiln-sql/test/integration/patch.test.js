var _ = require('lodash');
var Promise = require('bluebird');
var steps = require('./steps');

describesql('patch objects', function () {
  var shared = steps.init();

  describe('users', function () {
    it('should create users', function () {
      var user = {
        age: 23, isAdmin: true,
        email: 'test@klay.com',
        password: 'password',
        firstName: 'Klay',
        lastName: 'Thompson',
      };

      return Promise.all([
        shared.models.user.create(user),
        shared.models.user.create(_.defaults({firstName: 'klay2', email: 'test2@klay.com'}, user)),
      ]).then(function (items) {
        shared.userA = items[0];
        shared.userB = items[1];
      });
    });

    it('should update a single field', function () {
      var patch = _.assign(_.pick(shared.userA, 'id'), {email: 'newemail@example.com'});
      return shared.models.user.patch(patch).then(function (item) {
        item.should.have.property('email', 'newemail@example.com');
        item.should.have.property('updatedAt').instanceof(Date).greaterThan(shared.userA.updatedAt);

        var untouched = _.omit(item, ['updatedAt', 'email']);
        untouched.should.eql(_.omit(shared.userA, ['updatedAt', 'email']));
      });
    });

    it('should update a single field with just id', function () {
      return shared.models.user.patchById(shared.userA.id, {age: '27'}).then(function (item) {
        item.should.have.property('age', 27);
        item.should.have.property('updatedAt').instanceof(Date).greaterThan(shared.userA.updatedAt);

        var untouched = _.omit(item, ['updatedAt', 'email', 'age']);
        untouched.should.eql(_.omit(shared.userA, ['updatedAt', 'email', 'age']));
      });
    });

    it('should prevent changing immutable properties', function () {
      return shared.models.user.patchById(shared.userA.id, {createdAt: new Date()}).
        should.be.rejectedWith(/immutable.*violated/);
    });

    it('should prevent violating a unique constraint', function () {
      return shared.models.user.patchById(shared.userA.id, {email: 'test2@klay.com'}).
        should.be.rejectedWith(/unique.*violated/);
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

    it('should patch a photo', function () {
      var metadata = {type: 'jpeg', gps: 'otherr coords'};
      return shared.models.photo.patchById(shared.photoA.id, {metadata}).then(function (item) {
        item.should.have.property('metadata').eql(metadata);
        item.should.have.property('updatedAt').instanceof(Date).greaterThan(shared.photoA.updatedAt);

        var untouched = _.omit(item, ['updatedAt', 'metadata']);
        untouched.should.eql(_.omit(shared.photoA, ['updatedAt', 'metadata']));
      });
    });
  });
});
