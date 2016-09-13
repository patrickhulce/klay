var _ = require('lodash');
var klay = require('klay');
var Promise = require('bluebird');
var fixtureData = require('../fixtures/data');
var modelsFactory = require('../fixtures/models');
var extensionFactory = relativeRequire('extension.js');

var steps = module.exports = {
  init: function () {
    var shared = {};

    before(function () {
      shared.klayModels = modelsFactory();
    });

    after(function () {
      klay.reset();
      klay();
    });

    steps.cleanAndSync(shared);

    return shared;
  },
  cleanAndSync: function (shared) {
    it('should initialize properly', function () {
      var extensionOpts = _.assign({logging: _.noop}, mysqlOptions);
      var ext = shared.extension = extensionFactory(mysqlOptions);
      shared.sequelize = shared.extension._sequelize;

      var models = shared.models = {};
      models.user = ext.bake({name: 'user', model: shared.klayModels.user}, {});
      models.photo = ext.bake({name: 'photo', model: shared.klayModels.photo}, {}, {'user:sql': models.user});
      return ext.sync({force: true});
    });
  },
  insertData: function (shared) {
    it('should create data', function () {
      return Promise.map(fixtureData.users, shared.models.user.create).then(function (users) {
        var photosByUser = _.groupBy(fixtureData.photos, 'ownerId');
        var photos = _.values(photosByUser).map(function (photoSet, index) {
          return photoSet.map(photo => _.defaults({ownerId: users[index].id}, photo));
        });

        return Promise.map(_.flatten(photos), shared.models.photo.create);
      });
    });
  },
};
