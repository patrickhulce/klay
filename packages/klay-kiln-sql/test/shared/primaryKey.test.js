const klay = require('klay')
const klayDb = require('klay-db')

defineTest('shared/primaryKey.js', utils => {
  before(() => {
    klay.use(klayDb())
  })

  describe('#getPrimaryKeyField', () => {
    it('should return the name of the primaryKey field', () => {
      const model = klay.builders.object({
        primaryId: klay.builders.integerId(),
        name: klay.builders.string(),
      })

      utils.getPrimaryKeyField(model).should.equal('primaryId')
    })
  })
})
