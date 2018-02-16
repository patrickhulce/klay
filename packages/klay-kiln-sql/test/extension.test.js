const modelsFactory = require('./fixtures/models')

defineTest('extension.js', extensionFactory => {
  describe('#determineDependencies', () => {
    it('should request the foreign key dependencies', () => {
      const extension = extensionFactory({})
      const models = modelsFactory()
      const dependencies = extension.determineDependencies({model: models.photo})
      dependencies.should.eql(['user:sql'])
    })
  })
})
