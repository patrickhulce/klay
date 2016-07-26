var _ = require('lodash');
var Model = relativeRequire('Model.js');

defineTest('extensions/builders.js', function (buildersFactory) {
  var builders;

  beforeEach(function () {
    builders = buildersFactory(spec => new Model(spec)).builders;
  });

  var types = ['undefined', 'any', 'string', 'number', 'boolean', 'object', 'array'];
  types.forEach(function (type) {
    describe('#' + type, function () {
      it('should create a model with the specified type', function () {
        var model = builders[type]();
        model.should.be.instanceof(Model);
        model.spec.should.have.property('type', type);
      });

      if (type === 'object' || type === 'array') {
        it('should set spec.children', function () {
          var modelSpec = type === 'object' ?
            {id: builders.string()} :
            {type: 'string'};

          var model = builders[type](modelSpec);
          model.should.be.instanceof(Model);
          model.spec.should.have.property('type', type);
          if (type === 'array') {
            model.spec.should.have.property('children').an('object');
          } else {
            model.spec.should.have.property('children').
              with.deep.property('0.model').instanceof(Model);
          }
        });
      }
    });
  });

  describe('#enum', function () {
    it('should create a model with options from arguments', function () {
      var model = builders.enum(1, 2, 3);
      model.should.be.instanceof(Model);
      model.spec.should.have.property('options').eql([1, 2, 3]);
    });

    it('should create a model with options from array', function () {
      var model = builders.enum(['first', 'second', 'third']);
      model.should.be.instanceof(Model);
      model.spec.should.have.property('options').eql(['first', 'second', 'third']);
    });

    it('should fail when no arguments are given', function () {
      (() => builders.enum()).should.throw();
    });

    it('should fail when an empty array is given', function () {
      (() => builders.enum([])).should.throw();
    });
  });
});
