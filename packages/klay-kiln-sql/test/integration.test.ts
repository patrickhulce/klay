describe('integration tests', () => {
  require('./integration/cli.test')
  require('./integration/initialize.test')
  require('./integration/create.test')
  require('./integration/custom-constraints.test')
  require('./integration/patch.test')
  require('./integration/query.test')
  require('./integration/transaction.test')
  require('./integration/update.test')
  require('./integration/upsert.test')
})