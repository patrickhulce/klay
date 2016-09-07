var _ = require('lodash');
var klay = require('klay');
var klayDb = require('klay-db');
var extensionFactory = relativeRequire('extension.js');

describesql('initialize database', function () {
  var extension, user, sequelize;

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
    klay.reset();
    klay().use(klayDb()).use({defaults: {nullable: false}});

    var types = klay.builders;
    var userObj = {
      id: types.integerId(),
      age: types.integer().required(),
      email: types.email().required().max(250).unique(),
      password: types.string().required().max(32),
      firstName: types.string().required().max(100),
      lastName: types.string().required().max(100),
      createdAt: types.createdAt(),
      updatedAt: types.updatedAt(),
    };

    user = types.object(userObj).dbindexChildren(['email', 'password']);
    extension = extensionFactory(_.assign({logging: _.noop}, mysqlOptions));
    sequelize = extension._sequelize;
  });

  after(function () {
    klay.reset();
    klay();
  });

  it('should execute successfully', function () {
    extension.bake({name: 'user', model: user}, {});
    return extension.sync({force: true});
  });

  describe('users', function () {
    it('should have created a users table', function () {
      return sequelize.query('describe users').spread(function (results, metadata) {
        toTable(results).should.eql({
          id: {Type: 'bigint(20)', Key: 'PRI', Extra: 'auto_increment'},
          age: {Type: 'bigint(20)'},
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
});
