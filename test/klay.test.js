var _ = require('lodash');
var Model = relativeRequire('Model.js');

defineTest('klay.js', function (klay) {
  afterEach(function () {
    klay.reset();
  });

  describe('#()', function () {
    it('should return the klay object', function () {
      var inst = klay();
      inst.should.equal(klay);
      inst.should.have.property('use').a('function');
      inst.should.have.property('reset').a('function');
      inst.should.have.property('builders').an('object');
      inst.should.have.property('Model').a('function');
    });

    it('should initialize extensions by default', function () {
      var inst = klay();
      inst.builders.should.have.property('string');
    });

    it('should respect options passed in', function () {
      var inst = klay({extensions: false});
      inst.builders.should.eql({});
    });

    it('should return existing klay object when options are same', function () {
      var instA = klay({foobar: 123});
      var instB = klay({foobar: 123});
      instA.should.equal(instB);
    });
  });

  describe('#use', function () {
    var inst;

    beforeEach(function () {
      inst = klay();
    });

    it('should merge types', function () {
      inst.use({types: ['myFavoriteType']});
      Model.types.should.include('string');
      Model.types.should.include('myFavoriteType');
    });

    it('should merge formats', function () {
      inst.use({formats: {string: ['name', 'phone'], number: ['int']}});
      inst.use({formats: {string: ['address'], any: ['thing']}});
      Model.formats.should.have.property('any').eql(['thing']);
      Model.formats.should.have.property('number').eql(['int']);
      Model.formats.should.have.property('string').eql(['name', 'phone', 'address']);
    });

    it('should merge defaults', function () {
      inst.use({defaults: {strict: true, required: true}});
      Model.defaults.should.eql({strict: true, required: true, nullable: true});
      inst.use({defaults: {nullable: false}});
      Model.defaults.should.have.property('nullable', false);
    });

    it('should merge builders', function () {
      var myBuilder = () => 123;
      inst.use({builders: {foobar: myBuilder}});
      inst.builders.should.have.property('string').a('function');
      inst.builders.should.have.property('foobar', myBuilder);
    });

    it('should create builders from formats', function () {
      inst.use({
        builders: true,
        formats: {
          string: ['myName', 'other'],
          number: ['float', 'double'],
        }
      });

      inst.builders.should.have.property('string').a('function');
      inst.builders.should.have.property('myName').a('function');
      inst.builders.should.have.property('other').a('function');
      inst.builders.should.have.property('float').a('function');
      inst.builders.should.have.property('double').a('function');

      var modelA = inst.builders.myName();
      modelA.should.be.instanceof(Model);
      modelA.should.have.deep.property('spec.type', 'string');
      modelA.should.have.deep.property('spec.format', 'myName');

      var modelB = inst.builders.double();
      modelB.should.be.instanceof(Model);
      modelB.should.have.deep.property('spec.type', 'number');
      modelB.should.have.deep.property('spec.format', 'double');
    });

    it('should respect builderExtras', function () {
      inst.use({
        builders: true,
        builderExtras: {
          myName: model => model.options(['foo', 'bar']),
        },
        formats: {
          string: ['myName']
        }
      });

      var modelA = inst.builders.myName();
      modelA.should.be.instanceof(Model);
      modelA.should.have.deep.property('spec.type', 'string');
      modelA.should.have.deep.property('spec.format', 'myName');
      modelA.should.have.deep.property('spec.options').eql(['foo', 'bar']);
    });

    it('should merge transformations', function () {
      var nameTransform = value => value + 'NAME';
      var numberTransform = value => Number(value);
      inst.use({
        transformations: {
          string: {name: nameTransform},
          number: {__default: numberTransform}
        }
      });

      Model.transformations.should.have.deep.property('string.name', nameTransform);
      Model.transformations.should.have.deep.property('number.__default', numberTransform);
    });

    it('should merge validations', function () {
      var nameValidate = value => value + 'NAME';
      var numberValidate = value => Number(value);
      inst.use({
        validations: {
          string: {name: nameValidate},
          number: {__default: numberValidate}
        }
      });

      Model.validations.should.have.deep.property('string.name', nameValidate);
      Model.validations.should.have.deep.property('number.__default', numberValidate);
    });

    it('should merge and union validations', function () {
      var validationA = value => Number(value);
      var validationB = value => String(value);
      inst.use({validations: {number: {__default: [validationA]}}});
      inst.use({validations: {number: {__default: validationB}}});

      Model.validations.should.have.deep.property('number.__default').
        include(validationA).
        include(validationB);
    });

    it('should merge Model prototype', function () {
      var doIt = function (v) {
        this.foobar = v;
        return this;
      };

      inst.use({extend: {prop: 1, doIt: doIt}});
      inst.Model.prototype.should.have.property('prop', 1);
      var model = inst.builders.string().doIt(123);
      model.should.have.property('foobar', 123);
    });

    it('should merge Model prototype when extend is function', function () {
      var foobar = () => 'foobar';
      var extend = base => {
        base.hidden = true;
        base.should.have.property('type').a('function');
        base.should.have.property('format').a('function');
        base.should.have.property('required').a('function');
        base.should.have.property('foobar', foobar);
        return {prop: 1};
      };

      inst.use({extend: {foobar: foobar}});
      inst.use({extend: extend});
      inst.Model.prototype.should.not.have.property('hidden');
      inst.Model.prototype.should.have.property('prop', 1);
    });
  });
});
