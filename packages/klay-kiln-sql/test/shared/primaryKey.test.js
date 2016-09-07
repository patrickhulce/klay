var klay = require('klay');
var klayDb = require('klay-db');

defineTest('shared/primaryKey.js', function (utils) {
  before(function () {
    klay.use(klayDb());
  });

  describe('#getPrimaryKeyField', function () {
    it('should return the name of the primaryKey field', function () {
      var model = klay.builders.object({
        primaryId: klay.builders.integerId(),
        name: klay.builders.string(),
      });

      utils.getPrimaryKeyField(model).should.equal('primaryId');
    });
  });
});
