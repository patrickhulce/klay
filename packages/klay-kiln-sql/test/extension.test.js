var modelsFactory = require('./fixtures/models');

defineTest('extension.js', function (extensionFactory) {
  describe('#determineDependencies', function () {
    it('should request the foreign key dependencies', function () {
      var extension = extensionFactory({});
      var models = modelsFactory();
      var dependencies = extension.determineDependencies({model: models.photo});
      dependencies.should.eql(['user:sql']);
    });
  });
});
