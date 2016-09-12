var _ = require('lodash');
var steps = require('./steps');

describesql('initialize database', function () {
  var shared = steps.init();

  function toTable(results) {
    return _(results).
      map(item => {
        var firstPass = _.pick(item, ['Type', 'Key', 'Extra']);
        return {
          name: item.Field,
          value: _.pickBy(firstPass, v => Boolean(v)),
        };
      }).
      keyBy('name').
      mapValues('value').
      value();
  }

  describe('users', function () {
    it('should have created a users table', function () {
      return shared.sequelize.query('describe users').spread(function (results, metadata) {
        toTable(results).should.eql({
          id: {Type: 'bigint(20)', Key: 'PRI', Extra: 'auto_increment'},
          age: {Type: 'bigint(20)'},
          isAdmin: {Type: 'tinyint(1)'},
          email: {Type: 'varchar(250)', Key: 'UNI'},
          firstName: {Type: 'varchar(100)'},
          lastName: {Type: 'varchar(100)'},
          password: {Type: 'varchar(32)'},
          createdAt: {Type: 'datetime(6)'},
          updatedAt: {Type: 'datetime(6)'},
        });
      });
    });

    it('should have created the additional indexes', function () {
      return shared.sequelize.query('show index from users').spread(function (results) {
        _.filter(results, {Key_name: 'email_password'}).should.have.length(2);
      });
    });
  });

  describe('photos', function () {
    it('should have created a photos table', function () {
      return shared.sequelize.query('describe photos').spread(function (results, metadata) {
        toTable(results).should.eql({
          id: {Type: 'char(36)', Key: 'PRI'},
          ownerId: {Type: 'bigint(20)', Key: 'MUL'},
          aspectRatio: {Type: 'double'},
          metadata: {Type: 'text'},
          createdAt: {Type: 'datetime(6)'},
          updatedAt: {Type: 'datetime(6)'},
        });
      });
    });
  });
});
