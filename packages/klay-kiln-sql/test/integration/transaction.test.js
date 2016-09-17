var _ = require('lodash');
var steps = require('./steps');

describesql('atomic transactions', function () {
  var shared = steps.init();

  var defaultUser = {
    age: 23, isAdmin: true,
    email: 'test@klay.com',
    password: 'password',
    firstName: 'Klay',
    lastName: 'Thompson',
  };

  var defaultPhoto = {
    aspectRatio: 0.67,
    metadata: {type: 'jpeg', location: 'United States'},
  };

  it('should rollback creates', function () {
    var user = _.clone(defaultUser);
    return shared.models.user.transaction(function (transaction) {
      return shared.models.user.create(user, {transaction}).then(function (item) {
        shared.user = item;

        var photo = _.assign({}, defaultPhoto, {ownerId: -1});
        return shared.models.photo.create(photo, {transaction});
      });
    }).then(function () {
      throw new Error('should not have succeeded');
    }).catch(function (err) {
      err.message.should.not.equal('should not have succeeded');
      return shared.models.user.findById(shared.user.id).should.eventually.be.a('undefined');
    });
  });

  it('should commit creates', function () {
    var user = _.clone(defaultUser);
    return shared.models.user.transaction(function (transaction) {
      return shared.models.user.create(user, {transaction}).then(function (item) {
        shared.user = item;

        var photo = _.assign({}, defaultPhoto, {ownerId: item.id});
        return shared.models.photo.create(photo, {transaction});
      });
    }).then(function (photo) {
      shared.photo = photo;

      return shared.models.photo.findById(photo.id).then(function (dbPhoto) {
        photo.should.eql(dbPhoto);
      });
    });
  });

  it('should rollback updates', function () {
    var user = _.assign({}, shared.user, {age: '13'});
    return shared.models.user.transaction(function (transaction) {
      return shared.models.user.update(user, {transaction}).then(function () {
        var photo = _.assign({}, shared.photo, {aspectRatio: '2'});
        return shared.models.photo.update(photo, {transaction}).then(function () {
          throw new Error('fail!');
        });
      });
    }).then(function () {
      throw new Error('should not have succeeded');
    }).catch(function (err) {
      err.message.should.equal('fail!');

      return Promise.all([
        shared.models.user.findById(shared.user.id).should.eventually.have.property('age', 23),
        shared.models.photo.findById(shared.photo.id).should.eventually.have.property('aspectRatio', 0.67),
      ]);
    });
  });

  it('should commit updates', function () {
    var user = _.assign({}, shared.user, {age: '13'});
    return shared.models.user.transaction(function (transaction) {
      return shared.models.user.update(user, {transaction}).then(function (user) {
        var photo = _.assign({}, shared.photo, {aspectRatio: '2'});
        return shared.models.photo.update(photo, {transaction}).then(function (photo) {
          return [user, photo];
        });
      });
    }).spread(function (user, photo) {
      return shared.models.photo.findById(photo.id).then(function (dbPhoto) {
        dbPhoto.should.have.property('aspectRatio', 2);
        return shared.models.user.findById(user.id);
      }).then(function (dbUser) {
        dbUser.should.have.property('age', 13);
      });
    });
  });

  it('should rollback patches', function () {
    return shared.models.user.transaction(function (transaction) {
      return shared.models.user.patchById(shared.user.id, {age: '30'}, {transaction}).then(function (user) {
        return shared.models.photo.patchById(shared.photo.id, {aspectRatio: '0.5'}, {transaction}).then(function (photo) {
          return [user, photo];
        });
      }).then(function () {
        throw new Error('fail!');
      });
    }).then(function () {
      throw new Error('should not have succeeded');
    }).catch(function (err) {
      err.message.should.equal('fail!');

      return Promise.all([
        shared.models.user.findById(shared.user.id).should.eventually.have.property('age', 13),
        shared.models.photo.findById(shared.photo.id).should.eventually.have.property('aspectRatio', 2),
      ]);
    });
  });

  it('should commit patches', function () {
    return shared.models.user.transaction(function (transaction) {
      return shared.models.user.patchById(shared.user.id, {age: '30'}, {transaction}).then(function (user) {
        return shared.models.photo.patchById(shared.photo.id, {aspectRatio: '0.5'}, {transaction}).then(function (photo) {
          return [user, photo];
        });
      });
    }).spread(function (user, photo) {
      return shared.models.photo.findById(photo.id).then(function (dbPhoto) {
        dbPhoto.should.have.property('aspectRatio', 0.5);
        return shared.models.user.findById(user.id);
      }).then(function (dbUser) {
        dbUser.should.have.property('age', 30);
      });
    });
  });

  it('should rollback destroys', function () {
    return shared.models.user.transaction(function (transaction) {
      return shared.models.photo.destroyById(shared.photo.id, {transaction}).then(function () {
        return shared.models.user.destroyById(shared.user.id, {transaction}).then(function () {
          throw new Error('fail!');
        });
      });
    }).then(function () {
      throw new Error('should not have succeeded');
    }).catch(function (err) {
      err.message.should.equal('fail!');

      return Promise.all([
        shared.models.user.findById(shared.user.id).should.eventually.have.property('id', shared.user.id),
        shared.models.photo.findById(shared.photo.id).should.eventually.have.property('id', shared.photo.id),
      ]);
    });
  });

  it('should commit destroys', function () {
    return shared.models.user.transaction(function (transaction) {
      return shared.models.photo.destroyById(shared.photo.id, {transaction}).then(function () {
        return shared.models.user.destroyById(shared.user.id, {transaction});
      });
    }).then(function () {
      return Promise.all([
        shared.models.user.findById(shared.user.id).should.eventually.be.a('undefined'),
        shared.models.photo.findById(shared.photo.id).should.eventually.be.a('undefined'),
      ]);
    });
  });
});
