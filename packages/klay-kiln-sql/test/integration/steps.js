var _ = require('lodash');
var klay = require('klay');
var modelsFactory = require('../fixtures/models');
var extensionFactory = relativeRequire('extension.js');

module.exports = {
  init: function () {
    var shared = {};

    before(function () {
      shared.klayModels = modelsFactory();
      shared.extension = extensionFactory(_.assign({logging: _.noop}, mysqlOptions));
      shared.sequelize = shared.extension._sequelize;
    });

    after(function () {
      klay.reset();
      klay();
    });

    it('should initialize properly', function () {
      var ext = shared.extension;
      var models = shared.models = {};
      models.user = ext.bake({name: 'user', model: shared.klayModels.user}, {});
      models.photo = ext.bake({name: 'photo', model: shared.klayModels.photo}, {}, {'user:sql': models.user});
      return ext.sync({force: true});
    });

    return shared;
  },
};
