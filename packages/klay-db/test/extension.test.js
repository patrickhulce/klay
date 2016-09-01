var klay = require('klay');
var Options = relativeRequire('Options.js');

defineTest('extension.js', function (extension) {
  describe('#extend', function () {
    var inst = klay();
    inst.use(extension);

    var generateDate = () => new Date();
    var options = new Options().
      index('id').
      index('created_at', 'desc').
      automanage('created_at', 'create', generateDate);

    it('should add the properties to the model', function () {
      var model = inst.builders.object();
      model.db.should.be.a('function');
      model.dbindex.should.be.a('function');
      model.dbconstrain.should.be.a('function');
      model.dbautomanage.should.be.a('function');
    });

    it('should update the db property of the spec', function () {
      var model = inst.builders.object().
        dbindex('id').
        dbindex('created_at', 'desc').
        dbautomanage('created_at', 'create', generateDate);
      model.spec.db.should.eql(options.toObject());
    });

    describe('#db', function () {
      it('should update the db property of the spec', function () {
        var model = inst.builders.object().db(options);
        model.spec.should.have.deep.property('db.indexes').length(2);
        model.spec.should.have.deep.property('db.automanaged').length(1);
      });

      it('should update the db property of the spec with plain object', function () {
        var model = inst.builders.object().db(options.toObject());
        model.spec.should.have.deep.property('db.indexes').length(2);
        model.spec.should.have.deep.property('db.automanaged').length(1);
      });
    });

    describe('#dbindex', function () {
      it('should update the index property of db options', function () {
        var model = inst.builders.object().dbindex(['foo', '-bar']);
        model.spec.should.have.deep.property('db.indexes.0').eql([
          {property: 'foo', direction: 'asc'},
          {property: 'bar', direction: 'desc'},
        ]);
      });
    });

    describe('#dbconstrain', function () {
      it('should update the constraints property of db options', function () {
        var model = inst.builders.object().dbconstrain('id', 'primary');
        model.spec.should.have.deep.property('db.constraints.0').eql({
          properties: ['id'], type: 'primary', name: 'primary:id', meta: {}
        });
      });
    });

    describe('#dbautomanage', function () {
      it('should update the automanaged property of db options', function () {
        var model = inst.builders.object().dbautomanage('created_at', 'create', () => null);
        model.spec.should.have.deep.property('db.automanaged.0.property').eql('created_at');
      });
    });
  });
});
