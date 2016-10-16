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

    it('should create a set of users', function () {
      var userA = _.assign({}, defaultUser, {firstName: 'John', email: 'john@test.com'});
      var userB = _.assign({}, defaultUser, {firstName: 'Jade', email: 'jade@test.com'});
      return shared.models.user.upsert([userA, userB]).then(function (items) {
        items.should.have.length(2);
        items.forEach(function (item, index) {
          var expected = index === 0 ? userA : userB;
          item.should.have.property('id').is.a('number');
          item.should.have.property('createdAt').instanceof(Date);
          item.should.have.property('updatedAt').instanceof(Date);

          var untouched = _.omit(item, ['id', 'createdAt', 'updatedAt']);
          untouched.should.eql(expected);
        });
      });
    });

    it('should update an existing user by id', function () {
      var user = _.assign({}, shared.userA, {email: 'test2@example.com'});
      return shared.models.user.upsert(user).then(function (item) {
        item.should.have.property('email', 'test2@example.com');
        item.should.have.property('updatedAt').instanceof(Date).greaterThan(shared.userA.updatedAt);

        var untouched = _.omit(item, ['email', 'updatedAt']);
        untouched.should.eql(_.omit(shared.userA, ['email', 'updatedAt']));
        shared.userA = item;
      });
    });

    it('should update an existing user by unique constraints', function () {
      var user = _.assign({}, shared.userA, {age: 24, password: 'other'});
      return shared.models.user.upsert(user).then(function (item) {
        item.should.have.property('age', 24);
        item.should.have.property('password', 'other');
        item.should.have.property('updatedAt').instanceof(Date).greaterThan(shared.userA.updatedAt);

        var untouched = _.omit(item, ['age', 'password', 'updatedAt']);
        untouched.should.eql(_.omit(shared.userA, ['age', 'password', 'updatedAt']));
        shared.userA = item;
      });
    });

    it('should respect last updates to the same record', function () {
      var users = _.range(10).map(i => _.assign({}, _.omit(shared.userA, 'id'), {age: 100 + i}));
      return shared.models.user.upsert(users).then(function (dbUsers) {
        dbUsers.forEach(user => user.should.have.property('id', shared.userA.id));
        return shared.models.user.findById(shared.userA.id);
      }).should.eventually.have.property('age', 109);
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
