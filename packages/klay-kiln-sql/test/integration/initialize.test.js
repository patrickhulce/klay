var _ = require('lodash');
var klay = require('klay');
var klayDb = require('klay-db');
var modelsFactory = require('../fixtures/models');
var extensionFactory = relativeRequire('extension.js');

describesql('initialize database', function () {
  var extension, models, sequelize;

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

  before(function () {
    models = modelsFactory();
    extension = extensionFactory(_.assign({logging: _.noop}, mysqlOptions));
    sequelize = extension._sequelize;
  });

  after(function () {
    klay.reset();
    klay();
  });

  it('should execute successfully', function () {
    var userModel = extension.bake({name: 'user', model: models.user}, {});
    extension.bake({name: 'photo', model: models.photo}, {}, {'user:sql': userModel});
    return extension.sync({force: true});
  });

  describe('users', function () {
    it('should have created a users table', function () {
      return sequelize.query('describe users').spread(function (results, metadata) {
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
      return sequelize.query('show index from users').spread(function (results) {
        _.filter(results, {Key_name: 'email_password'}).should.have.length(2);
      });
    });
  });

  describe('photos', function () {
    it('should have created a photos table', function () {
      return sequelize.query('describe photos').spread(function (results, metadata) {
        toTable(results).should.eql({
          id: {Type: 'char(36)', Key: 'PRI'},
          ownerId: {Type: 'bigint(20)', Key: 'MUL'},
          aspectRatio: {Type: 'double'},
          createdAt: {Type: 'datetime(6)'},
          updatedAt: {Type: 'datetime(6)'},
        });
      });
    });
  });
});
