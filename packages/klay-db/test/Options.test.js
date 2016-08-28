var _ = require('lodash');

defineTest('Options.js', function (Options) {
  describe('#constructor', function () {
    it('should set spec properties', function () {
      var opts = new Options({indexes: [{property: 'foo', direction: 'asc'}]});
      opts.should.have.deep.property('spec.indexes.0.property', 'foo');
    });

    it('should return the argument when it is already an options', function () {
      var optsA = new Options({hello: 1});
      var optsB = new Options(optsA);
      optsB.should.equal(optsA);
    });
  });

  describe('#automanage', function () {
    var opts;

    beforeEach(function () { opts = new Options(); });

    it('should add the first automanaged property', function () {
      var supplyWith = () => new Date();
      opts = opts.automanage('myprop', 'create', 'post-validate', supplyWith);
      opts.spec.should.have.property('automanaged').eql([{
        property: 'myprop', on: 'create',
        lifecycle: 'post-validate',
        supplyWith: supplyWith,
      }]);
    });

    it('should add the second automanaged property', function () {
      var supplyWith = () => new Date();
      opts = opts.
        automanage('mypropA', 'create', 'post-validate', _.identity).
        automanage('mypropB', 'update', supplyWith);

      opts.spec.should.have.deep.property('automanaged.1').eql({
        property: 'mypropB', on: 'update',
        lifecycle: 'pre-validate',
        supplyWith: supplyWith,
      });
    });

    it('should work with pre-existing automanaged properties', function () {
      var supplyWith = () => new Date();
      opts = new Options({automanaged: [null, null]}).
        automanage('mypropC', 'create', supplyWith);

      opts.spec.should.have.deep.property('automanaged.2').eql({
        property: 'mypropC', on: 'create',
        lifecycle: 'pre-validate',
        supplyWith: supplyWith,
      });
    });
  });

  describe('#constrain', function () {
    var opts;

    beforeEach(function () { opts = new Options(); });

    it('should add the first constraint property', function () {
      opts = opts.constrain('id', 'primary');
      opts.spec.should.have.property('constraints').eql([{
        properties: ['id'], type: 'primary', meta: undefined
      }]);
    });

    it('should add the second constraint property', function () {
      opts = opts.
        constrain('id', 'primary').
        constrain(['day', 'other'], 'unique', {behavior: 'reject'});

      opts.spec.should.have.deep.property('constraints.1').eql({
        properties: ['day', 'other'],
        type: 'unique',
        meta: {behavior: 'reject'},
      });
    });

    it('should add a reference constraint property', function () {
      opts = opts.
        constrain('id', 'primary').
        constrain(['parent_id', 'other'], 'reference', {lookupTable: 'parents'});

      opts.spec.should.have.deep.property('constraints.1').eql({
        properties: ['parent_id', 'other'],
        type: 'reference',
        meta: {lookupTable: 'parents'},
      });
    });

    it('should add a custom constraint property', function () {
      opts = opts.constrain(['something', 'other'], 'custom', {foo: 'bar'});

      opts.spec.should.have.deep.property('constraints.0').eql({
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
      var meta = {lookupTable: 'parents'};
      var opts = new Options().
        index('type').
        index(['type', 'size', '-created_at']).
        automanage('checksum', 'update', 'post-validate', checksum).
        automanage('created_at', 'create', now).
        automanage('updated_at', 'update', now).
        constrain('id', 'primary').
        constrain(['type', 'version'], 'unique').
        constrain(['parent_id', 'parent_type'], 'reference', meta);

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
          {property: 'checksum', on: 'update', lifecycle: 'post-validate', supplyWith: checksum},
          {property: 'created_at', on: 'create', lifecycle: 'pre-validate', supplyWith: now},
          {property: 'updated_at', on: 'update', lifecycle: 'pre-validate', supplyWith: now},
        ],
        constraints: [
          {properties: ['id'], type: 'primary', meta: undefined},
          {properties: ['type', 'version'], type: 'unique', meta: undefined},
          {properties: ['parent_id', 'parent_type'], type: 'reference', meta},
        ],
      });
    });
  });
});
