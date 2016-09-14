var _ = require('lodash');
var steps = require('./steps');

describesql('upsert objects', function () {
  var shared = steps.init();

  describe('users', function () {
    var defaultUser = {
      age: 23, isAdmin: true,
      email: 'test@klay.com',
      password: 'password',
      firstName: 'Klay',
      lastName: 'Thompson',
    };

    it('should create a user', function () {
      var user = _.clone(defaultUser);
      return shared.models.user.upsert(user).then(function (item) {
        var userA = shared.userA = item;
        userA.should.have.property('id').is.a('number');
        userA.should.have.property('createdAt').instanceof(Date);
        userA.should.have.property('updatedAt').instanceof(Date);

        var untouched = _.omit(userA, ['id', 'createdAt', 'updatedAt']);
        untouched.should.eql(user);
      });
    });

    it('should update an existing user by id', function () {
      var user = _.assign({}, shared.userA, {email: 'test2@example.com'});
      return shared.models.user.upsert(user).then(function (item) {
        item.should.have.property('id', shared.userA.id);
        item.should.have.property('email', 'test2@example.com');
        item.should.have.property('updatedAt').instanceof(Date).greaterThan(shared.userA.updatedAt);

        var untouched = _.omit(item, ['email', 'updatedAt']);
        untouched.should.eql(_.omit(shared.userA, ['email', 'updatedAt']));
        shared.userA = item;
      });
    });

    it('should update an existing user by unique constraints', function () {
      var user = _.assign({}, defaultUser, {email: 'test2@example.com', age: 24, password: 'other'});
      return shared.models.user.upsert(user).then(function (item) {
        item.should.have.property('id', shared.userA.id);
        item.should.have.property('age', 24);
        item.should.have.property('password', 'other');
        item.should.have.property('updatedAt').instanceof(Date).greaterThan(shared.userA.updatedAt);

        var untouched = _.omit(item, ['age', 'password', 'updatedAt']);
        untouched.should.eql(_.omit(shared.userA, ['age', 'password', 'updatedAt']));
      });
    });

    it('should prevent ambiguous updates by unique constraints', function () {
      var user = _.assign({}, defaultUser, {email: 'test2@example.com', firstName: 'Charles'});
      return shared.models.user.upsert(user).should.be.rejectedWith(/ambiguous upsert/);
    });
  });

  describe('photos', function () {
    it('should create a photo', function () {
      var metadata = {type: 'jpeg', location: 'United States'};
      var photo = {ownerId: shared.userA.id, aspectRatio: 0.67, metadata};
      return shared.models.photo.upsert(photo).then(function (item) {
        item.should.have.property('id').match(/^\w{8}-\w{4}/);
        item.should.have.property('createdAt').instanceof(Date);
        item.should.have.property('updatedAt').instanceof(Date);

        var untouched = _.omit(item, ['id', 'createdAt', 'updatedAt']);
        untouched.should.eql(photo);
      });
    });
  });
});
