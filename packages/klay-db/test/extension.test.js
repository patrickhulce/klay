var klay = require('klay');
var Options = relativeRequire('Options.js');

defineTest('extension.js', function (extension) {
  describe('#extend', function () {
    var inst = klay();
    inst.use(extension);

    var options = new Options().
      index('id').
      index('created_at', 'desc').
      automanage('created_at', 'create', () => new Date());

    it('should add the property to the model', function () {
      var model = inst.builders.string();
      model.db.should.be.a('function');
    });

    it('should update the db property of the spec', function () {
      var model = inst.builders.string().db(options);
      model.spec.should.have.deep.property('db.indexes').length(2);
      model.spec.should.have.deep.property('db.automanaged').length(1);
    });

    it('should update the db property of the spec with plain object', function () {
      var model = inst.builders.string().db(options.toObject());
      model.spec.should.have.deep.property('db.indexes').length(2);
      model.spec.should.have.deep.property('db.automanaged').length(1);
    });
  });
});
