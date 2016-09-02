var _ = require('lodash');

defineTest('Options.js', function (Options) {
  describe('#constructor', function () {
    it('should set spec properties', function () {
      var opts = new Options({indexes: [{property: 'foo', direction: 'asc'}]});
      opts.should.be.instanceof(Options);
      opts.should.have.deep.property('spec.indexes.0.property', 'foo');
    });

    it('should return the argument when it is already an options', function () {
      var optsA = new Options({hello: 1});
      var optsB = new Options(optsA);
      optsB.should.equal(optsA);
    });

    it('should work when not using `new`', function () {
      var opts = Options({hello: 'blasphemy'});
      opts.should.be.instanceof(Options);
      opts.should.have.deep.property('spec.hello', 'blasphemy');
    });
  });

  describe('#automanage', function () {
    var opts;

    beforeEach(function () { opts = new Options(); });

    it('should add the first automanaged property', function () {
      var supplyWith = () => new Date();
      opts = opts.automanage('myprop', 'create', 'post-validate', supplyWith);
      opts.spec.should.have.property('automanaged').eql([{
        property: 'myprop', event: 'create',
        step: 'post-validate',
        supplyWith: supplyWith,
      }]);
    });

    it('should add the second automanaged property', function () {
      var supplyWith = () => new Date();
      opts = opts.
        automanage('mypropA', 'create', 'post-validate', _.identity).
        automanage('mypropB', 'update', supplyWith);

      opts.spec.should.have.deep.property('automanaged.1').eql({
        property: 'mypropB', event: 'update',
        step: 'pre-validate',
        supplyWith: supplyWith,
      });
    });

    it('should support autoincrement supplyWith', function () {
      opts = opts.automanage('mypropA', 'create', 'insert', 'autoincrement');

      opts.spec.should.have.deep.property('automanaged.0').eql({
        property: 'mypropA', event: 'create', step: 'insert',
        supplyWith: 'autoincrement',
      });
    });

    it('should support date supplyWith', function () {
      opts = opts.automanage('mypropA', 'create', 'post-validate', 'date');
      opts.spec.should.have.deep.property('automanaged.0.supplyWith').a('function');
      opts.spec.automanaged[0].supplyWith().should.be.an.instanceof(Date);
    });

    it('should support isotimestamp supplyWith', function () {
      opts = opts.automanage('mypropA', 'create', 'post-validate', 'isotimestamp');
      opts.spec.should.have.deep.property('automanaged.0.supplyWith').a('function');
      opts.spec.automanaged[0].supplyWith().should.match(/^\d{4}-\d{2}-\d{2}/);
    });

    it('should work with pre-existing automanaged properties', function () {
      var supplyWith = () => new Date();
      opts = new Options({automanaged: [null, null]}).
        automanage('mypropC', 'create', supplyWith);

      opts.spec.should.have.deep.property('automanaged.2').eql({
        property: 'mypropC', event: 'create',
        step: 'pre-validate',
        supplyWith: supplyWith,
      });
    });

    it('should fail when no property is given', function () {
      (function () {
        opts.automanage(null, 'create', _.noop);
      }).should.fail;
    });

    it('should fail when unknown event is given', function () {
      (function () {
        opts.automanage('prop', 'something', _.noop);
      }).should.fail;
    });

    it('should fail when unknown step is given', function () {
      (function () {
        opts.automanage('mypropA', 'create', 'unknown', _.noop);
      }).should.fail;
    });

    it('should fail when unknown supplyWith is given', function () {
      (function () {
        opts.automanage('mypropA', 'create', 'post-validate', 'foobar');
      }).should.fail;
    });
  });

  describe('#constrain', function () {
    var opts;

    beforeEach(function () { opts = new Options(); });

    it('should add the first constraint property', function () {
      opts = opts.constrain('id', 'primary');
      opts.spec.should.have.property('constraints').eql([{
        name: 'primary:id', properties: ['id'], type: 'primary', meta: {}
      }]);
    });

    it('should add the second constraint property', function () {
      opts = opts.
        constrain('id', 'primary').
        constrain(['day', 'other'], 'unique', {behavior: 'reject'});

      opts.spec.should.have.deep.property('constraints.1').eql({
        name: 'unique:day,other',
        properties: ['day', 'other'],
        type: 'unique',
        meta: {behavior: 'reject'},
      });
    });

    it('should add a reference constraint property', function () {
      var meta = {lookupTable: 'parents', name: 'reference:parent'};
      opts = opts.
        constrain('id', 'primary').
        constrain(['parent_id', 'other'], 'reference', meta);

      opts.spec.should.have.deep.property('constraints.1').eql({
        name: 'reference:parent',
        properties: ['parent_id', 'other'],
        type: 'reference',
        meta: meta,
      });
    });

    it('should add an immutable constraint property', function () {
      opts = opts.
        constrain('id', 'primary').
        constrain(['canonical_id', 'unchangeable'], 'immutable');

      opts.spec.should.have.deep.property('constraints.1').eql({
        name: 'immutable:canonical_id,unchangeable',
        properties: ['canonical_id', 'unchangeable'],
        type: 'immutable',
        meta: {},
      });
    });

    it('should add a custom constraint property', function () {
      opts = opts.constrain(['something', 'other'], 'custom', {foo: 'bar'});

      opts.spec.should.have.deep.property('constraints.0').eql({
        name: 'custom:something,other',
        properties: ['something', 'other'],
        type: 'custom',
        meta: {foo: 'bar'},
      });
    });
  });

  describe('#index', function () {
    var opts;

    beforeEach(function () { opts = new Options(); });

    it('should add the first index', function () {
      opts = opts.index('myprop', 'desc');
      opts.spec.should.have.property('indexes').eql([
        [{property: 'myprop', direction: 'desc'}]
      ]);
    });

    it('should add the second index', function () {
      opts = opts.
        index('myprop').
        index(['otherprop', '-second']);

      opts.spec.should.have.deep.property('indexes.1').eql([
        {property: 'otherprop', direction: 'asc'},
        {property: 'second', direction: 'desc'},
      ]);
    });

    it('should add a mixed index', function () {
      opts = opts.index(['some', {property: 'foo', direction: 'desc'}]);
      opts.spec.should.have.deep.property('indexes.0').eql([
        {property: 'some', direction: 'asc'},
        {property: 'foo', direction: 'desc'},
      ]);
    });
  });

  describe('#toObject', function () {
    var now = () => new Date();
    var checksum = item => item.id * Math.random();

    it('should return all of the settings', function () {
      var meta = {lookupTable: 'parents', name: 'reference:parent'};
      var opts = new Options().
        index('type').
        index(['type', 'size', '-created_at']).
        automanage('checksum', 'update', 'post-validate', checksum).
        automanage('created_at', 'create', now).
        automanage('updated_at', 'update', now).
        constrain('id', 'primary').
        constrain(['type', 'version'], 'unique').
        constrain(['parent_id'], 'reference', meta);

      opts.spec.should.eql({
        indexes: [
          [
            {property: 'type', direction: 'asc'}
          ],
          [
            {property: 'type', direction: 'asc'},
            {property: 'size', direction: 'asc'},
            {property: 'created_at', direction: 'desc'},
          ],
        ],
        automanaged: [
          {property: 'checksum', event: 'update', step: 'post-validate', supplyWith: checksum},
          {property: 'created_at', event: 'create', step: 'pre-validate', supplyWith: now},
          {property: 'updated_at', event: 'update', step: 'pre-validate', supplyWith: now},
        ],
        constraints: [
          {name: 'primary:id', properties: ['id'], type: 'primary', meta: {}},
          {name: 'unique:type,version', properties: ['type', 'version'], type: 'unique', meta: {}},
          {name: 'reference:parent', properties: ['parent_id'], type: 'reference', meta},
        ],
      });
    });
  });
});
