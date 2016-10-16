var _ = require('lodash');
var steps = require('./steps');

describesql('create objects', function () {
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
      return shared.models.user.create(user).then(function (item) {
        var userA = shared.userA = item;
        userA.should.have.property('id').is.a('number');
        userA.should.have.property('createdAt').instanceof(Date);
        userA.should.have.property('updatedAt').instanceof(Date);

        var untouched = _.omit(userA, ['id', 'createdAt', 'updatedAt']);
        untouched.should.eql(user);
      });
    });

    it('should create a 2nd user', function () {
      var user = _.assign({}, defaultUser, {firstName: 'Klay2', email: 'test2@foobar.com'});
      return shared.models.user.create(user).then(function (item) {
        item.should.have.property('id').is.a('number').greaterThan(shared.userA.id);
        item.should.have.property('createdAt').instanceof(Date).greaterThan(shared.userA.createdAt);
        item.should.have.property('updatedAt').instanceof(Date).greaterThan(shared.userA.updatedAt);

        var untouched = _.omit(item, ['id', 'createdAt', 'updatedAt']);
        untouched.should.eql(user);
      });
    });

    it('should create a set of users', function () {
      var userA = _.assign({}, defaultUser, {firstName: 'Klay3', email: 'test3@foobar.com'});
      var userB = _.assign({}, defaultUser, {firstName: 'Klay4', email: 'test4@foobar.com'});

      return shared.models.user.create([userA, userB]).then(function (items) {
        items.should.have.length(2);
        items.forEach(function (item, index) {
          item.should.have.property('id').is.a('number').greaterThan(shared.userA.id);
          item.should.have.property('createdAt').instanceof(Date).greaterThan(shared.userA.createdAt);
          item.should.have.property('updatedAt').instanceof(Date).greaterThan(shared.userA.updatedAt);

          var untouched = _.omit(item, ['id', 'createdAt', 'updatedAt']);
          untouched.should.eql(index === 0 ? userA : userB);
        });
      });
    });

    it('should prevent creation of user with same email', function () {
      var user = _.assign({}, defaultUser, {firstName: 'missing'});
      return shared.models.user.create(user).should.be.rejectedWith(/constraint.*email.*violated/);
    });

    it('should prevent creation of user with preset id', function () {
      var user = _.assign({}, defaultUser, {id: 15, firstName: 'missing'});
      return shared.models.user.create(user).should.be.rejectedWith(/expected 15.*undefined/);
    });

    it('should prevent creation of user with invalid values', function () {
      var user = _.assign({}, defaultUser, {age: 'what', firstName: 'missing'});
      return shared.models.user.create(user).should.be.rejectedWith(/must be.*integer/);
    });

    it('should prevent creation of users when one is invalid', function () {
      var userA = _.assign({}, defaultUser, {firstName: 'Klay5', email: 'test5@foobar.com'});
      var userB = _.assign({}, defaultUser, {firstName: 'Klay6', email: 'test4@foobar.com'});
      var userC = _.assign({}, defaultUser, {firstName: 'Klay7', email: 'test6@foobar.com'});
      var promise = shared.models.user.create([userA, userB, userC]);
      return promise.should.be.rejectedWith(/constraint.*email.*violated/);
    });

    it('should have prevented creation of other users when one is invalid', function () {
      var where = {firstName: 'Klay5'};
      return shared.models.user.findOne({where}).should.eventually.eql(undefined);
    });
  });

  describe('photos', function () {
    it('should create a photo', function () {
      var metadata = {type: 'jpeg', location: 'United States'};
      var photo = {ownerId: shared.userA.id, aspectRatio: 0.67, metadata};
      return shared.models.photo.create(photo).then(function (item) {
        item.should.have.property('id').match(/^\w{8}-\w{4}/);
        item.should.have.property('createdAt').instanceof(Date);
        item.should.have.property('updatedAt').instanceof(Date);

        var untouched = _.omit(item, ['id', 'createdAt', 'updatedAt']);
        untouched.should.eql(photo);
      });
    });

    it('should prevent creation of photo with non-existant owner', function () {
      var metadata = {type: 'jpeg', location: 'United States'};
      var photo = {ownerId: -1, aspectRatio: 2, metadata};
      return shared.models.photo.create(photo).should.be.rejectedWith(/foreign key constraint/);
    });
  });
});
