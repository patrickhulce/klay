var _ = require('lodash');

defineTest('kiln.js', function (Kiln) {
  var extensionApi = {bake: _.noop, determineDependencies: _.noop, name: ''};

  describe('#add', function () {
    var kiln, model = {something: 'else'};

    beforeEach(function () { kiln = Kiln() });

    it('should add a model', function () {
      kiln.add('user', model);
      kiln.getModels().should.eql({
        user: {
          name: 'user', model: model,
          metadata: {}, extensions: [],
        }
      });
    });

    it('should add a model with metadata', function () {
      var metadata = {plural: 'accounts'};
      kiln.add('account', model, metadata);
      kiln.getModels().should.eql({
        account: {
          name: 'account', model: model,
          metadata: metadata, extensions: [],
        }
      });
    });
  });

  describe('#extend', function () {
    var kiln, model;

    beforeEach(function () {
      model = {};
      kiln = Kiln().add('user', model);
    });

    it('should add an extension', function () {
      kiln.extend('user', extensionApi);
      kiln.getModels().should.have.deep.property('user.extensions.0').eql({
        extension: extensionApi, options: {},
      });
    });

    it('should add an extension with options', function () {
      var options = {foo: 'bar'};
      kiln.extend('user', extensionApi, options);
      kiln.getModels().should.have.deep.property('user.extensions.0').eql({
        extension: extensionApi, options: options,
      });
    });

    it('should add a global extension', function () {
      kiln.extend(extensionApi);
      kiln.getModels().should.have.deep.property('user.extensions').length(0);
    });
  });

  describe('#bake', function () {
    var kiln, sandbox, extensionABake;

    beforeEach(function () {
      kiln = Kiln();
      sandbox = createSandbox();
    });


    function complexKiln() {
      var extensionA = _.defaults({name: 'A'}, extensionApi);
      var extensionB = _.defaults({name: 'B'}, extensionApi);
      var extensionC = _.defaults({name: 'C'}, extensionApi);
      extensionABake = sandbox.stub(extensionA, 'bake');
      extensionABake.returns({resultA: 'foo'});
      sandbox.stub(extensionB, 'bake').returns({resultB: 'bar'});
      sandbox.stub(extensionC, 'bake').returns({resultC: 'baz'});
      delete extensionB.determineDependencies;

      kiln.
        add('user', {}).
        extend('user', extensionA).
        extend('user', extensionB).
        add('photo', {}).
        extend('photo', extensionC);
    }

    it('should generate for all models and extensions', function () {
      complexKiln();
      kiln.bake().should.eql({
        user: {
          A: {resultA: 'foo'},
          B: {resultB: 'bar'},
        },
        photo: {
          C: {resultC: 'baz'},
        },
      });
    });

    it('should generate global extensions', function () {
      complexKiln();
      var extension = _.defaults({name: 'globalA'}, extensionApi);
      sandbox.stub(extension, 'bake').returns({global: 'value'});
      kiln.extend(extension);

      var results = kiln.bake();
      results.should.have.deep.property('user.globalA.global', 'value');
      results.should.have.deep.property('photo.globalA.global', 'value');
    });

    it('should generate for all extensions', function () {
      complexKiln();
      kiln.bake('user').should.eql({
        A: {resultA: 'foo'},
        B: {resultB: 'bar'},
      });
    });

    it('should generate for a specific model and extension', function () {
      complexKiln();
      kiln.bake('user', 'A').should.eql({resultA: 'foo'});
    });

    it('should generate for a specific model and global extension', function () {
      complexKiln();
      var extension = _.defaults({name: 'globalA'}, extensionApi);
      sandbox.stub(extension, 'bake').returns({global: 'value'});
      kiln.extend(extension);

      kiln.bake('user', 'globalA').should.eql({global: 'value'});
    });

    it('should generate an extension without advanced configuration', function () {
      complexKiln();
      var extension = _.defaults({name: 'cool'}, extensionApi);
      sandbox.stub(extension, 'bake').returns({rando: 'value'});
      kiln.bake('user', extension).should.eql({rando: 'value'});
    });

    it('should create dependencies', function () {
      var dep1Options = {opt: 1};
      var dep2Options = {opt: 2};
      var extensionOptions = {opt: 3};
      var dep1 = _.defaults({name: 'dep1'}, extensionApi);
      var dep2 = _.defaults({name: 'dep2'}, extensionApi);
      var extension = _.defaults({name: 'ext'}, extensionApi);

      var userModel = {user: 1};
      var userOptions = {opt: 'user'};
      var photoModel = {photo: 1};

      var dep1Stub = sandbox.stub(dep1, 'bake');
      var dep2Stub = sandbox.stub(dep2, 'bake');
      var bakeStub = sandbox.stub(extension, 'bake');
      var dependenciesStub = sandbox.stub(extension, 'determineDependencies');
      dep1Stub.returns({result: 'dep1'});
      dep2Stub.returns({result: 'dep2'});
      dependenciesStub.returns(['dep1', 'photo:dep2']);
      bakeStub.returns({result: true});

      kiln.
        add('user', userModel, userOptions).
        extend('user', dep1, dep1Options).
        add('photo', photoModel).
        extend('photo', dep2, dep2Options);

      kiln.bake('user', extension, extensionOptions).should.eql({result: true});
      dep1Stub.should.have.been.calledOnce;
      dep2Stub.should.have.been.calledOnce;
      dependenciesStub.should.have.been.calledOnce;

      var dependenciesArgs = dependenciesStub.firstCall.args;
      dependenciesArgs.should.have.deep.property('0.name', 'user');
      dependenciesArgs.should.have.deep.property('0.model', userModel);
      dependenciesArgs.should.have.deep.property('0.metadata', userOptions);
      dependenciesArgs.should.have.property('1', extensionOptions);

      var dep1Args = dep1Stub.firstCall.args;
      dep1Args.should.have.deep.property('0.name', 'user');
      dep1Args.should.have.deep.property('0.model', userModel);
      dep1Args.should.have.deep.property('0.metadata', userOptions);
      dep1Args.should.have.property('1').eql(dep1Options);
      dep1Args.should.have.property('2').eql({});

      var dep2Args = dep2Stub.firstCall.args;
      dep2Args.should.have.deep.property('0.name', 'photo');
      dep2Args.should.have.deep.property('0.model', photoModel);
      dep2Args.should.have.deep.property('0.metadata').eql({});
      dep2Args.should.have.property('1').eql(dep2Options);
      dep2Args.should.have.property('2').eql({});

      var bakeArgs = bakeStub.firstCall.args;
      bakeArgs.should.have.deep.property('0.name', 'user');
      bakeArgs.should.have.deep.property('0.model', userModel);
      bakeArgs.should.have.deep.property('0.metadata', userOptions);
      bakeArgs.should.have.property('1').eql(extensionOptions);
      bakeArgs.should.have.property('2').eql({dep1: {result: 'dep1'}, 'photo:dep2': {result: 'dep2'}});
    });

    it('should cache results of already baked extensions', function () {
      complexKiln();
      var resultA = kiln.bake('user', 'A');
      var resultB = kiln.bake('user', 'A');
      resultA.should.equal(resultB);
      extensionABake.should.have.been.calledOnce;
    });

    it('should not cache results of already baked extensions with different options', function () {
      complexKiln();
      var resultA = kiln.bake('user', 'A');
      var resultB = kiln.bake('user', 'A', {different: 'option'});
      var resultC = kiln.bake('user', 'A');
      resultA.should.equal(resultB);
      resultB.should.equal(resultC);
      extensionABake.should.have.been.calledThrice;
    });

    it('should fail when referencing an unknown model', function () {
      (function () {
        complexKiln();
        kiln.bake('foobar', 'A');
      }).should.throw(Error);
    });
  });

  describe('#clearCache', function () {
    var sandbox;

    beforeEach(function () { sandbox = createSandbox(); });

    it('should force regeneration of new extensions', function () {
      var extension = _.defaults({name: 'foo'}, extensionApi);
      var kiln = Kiln().add('user', {}).extend('user', extension);

      var bakeStub = sandbox.stub(extension, 'bake');
      bakeStub.
        onFirstCall().returns({result: 1}).
        onSecondCall().returns({result: 2});

      kiln.bake('user', 'foo');
      var resultA = kiln.bake('user', 'foo');
      kiln.clearCache();
      var resultB = kiln.bake('user', 'foo');
      resultA.should.not.equal(resultB);
      bakeStub.should.have.been.calledTwice;
    });
  });

  describe('#reset', function () {
    var sandbox;

    beforeEach(function () { sandbox = createSandbox(); });

    it('should clear all models', function () {
      var kiln = Kiln().add('user', {}).add('photo', {});
      kiln.getModels().should.have.property('user');
      kiln.reset();
      kiln.getModels().should.eql({});
    });

    it('should clear the cache', function () {
      var extension = _.defaults({name: 'foo'}, extensionApi);
      var kiln = Kiln().add('user', {}).extend('user', extension);

      var bakeStub = sandbox.stub(extension, 'bake');
      bakeStub.returns({result: true});
      kiln.bake('user', 'foo');
      bakeStub.should.have.been.calledOnce;

      kiln.reset();
      kiln.add('user', {}).extend('user', extension);
      kiln.bake('user', 'foo');
      bakeStub.should.have.been.calledTwice;
    });
  });
});
