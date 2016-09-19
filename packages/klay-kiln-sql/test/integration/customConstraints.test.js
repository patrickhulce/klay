var _ = require('lodash');
var steps = require('./steps');

describesql('complex constraints', function () {
  var ageError = 'users can only get older';
  var youngerError = 'new users must be younger than existing population';
  var lastNameError = 'cannot have more than 3 people with same lastName';

  var shared = steps.init(function (models) {
    models.user = models.user.
      dbconstrain('custom', {
        assert: function (object, record) {
          if (record && object.age < record.age) {
            throw new Error(ageError);
          } else if (!record) {
            return this.where('age', {$lt: object.age}).fetchCount().then(function (count) {
              if (count > 0) { throw new Error(youngerError); }
            });
          }
        }
      }).
      dbconstrain('custom', {
        assert: function (object, record) {
          if (record && object.lastName === record.lastName) { return; }
          return this.where('lastName', object.lastName).fetchCount().then(function (count) {
            if (count >= 2) { throw new Error(lastNameError); }
          });
        }
      });
  });

  describe('users', function () {
    var defaultUser = {
      age: 23, isAdmin: true,
      email: 'test@klay.com',
      password: 'password',
      firstName: 'Klay',
      lastName: 'Thompson',
    };

    it('should create a Thompson user', function () {
      var user = _.assign({}, defaultUser, {age: '50'});
      return shared.models.user.create(user).then(record => shared.userA = record);
    });

    it('should create a non-Thompson user', function () {
      var user = _.assign({}, defaultUser, {email: 'a@b.com', lastName: 'Johnson', age: 49});
      return shared.models.user.create(user).then(record => shared.userB = record);
    });

    it('should fail to create an older user', function () {
      var user = _.assign({}, defaultUser, {email: 'b@c.com', firstName: 'Kris', age: 70});
      return shared.models.user.create(user).should.eventually.be.rejectedWith(youngerError);
    });

    it('should create another Thompson user', function () {
      var user = _.assign({}, defaultUser, {email: 'c@d.com', firstName: 'Kim', age: 42});
      return shared.models.user.create(user).then(record => shared.userC = record);
    });

    it('should fail to create another Thompson user', function () {
      var user = _.assign({}, defaultUser, {email: 'd@e.com', firstName: 'Kanye', age: 40});
      return shared.models.user.create(user).should.eventually.be.rejectedWith(lastNameError);
    });

    it('should update a Thompson user\'s firstName and age', function () {
      var user = _.assign({}, shared.userA, {firstName: 'Bill', age: '55'});
      return shared.models.user.update(user);
    });

    it('should fail to update a non-Thompson user to a Thompson', function () {
      var user = _.assign({}, shared.userB, {lastName: 'Thompson'});
      return shared.models.user.update(user).should.eventually.be.rejectedWith(lastNameError);
    });

    it('should fail to make a user younger', function () {
      var user = _.assign({}, shared.userC, {age: 20});
      return shared.models.user.update(user).should.eventually.be.rejectedWith(ageError);
    });
  });
});