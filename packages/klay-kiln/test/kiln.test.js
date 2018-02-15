const _ = require('lodash')
const sinon = require('sinon')
const Kiln = require('../lib/kiln')

describe('kiln.js', () => {
  const extensionApi = {bake: _.noop, determineDependencies: _.noop, name: ''}

  describe('#add', () => {
    const model = {something: 'else'}
    let kiln

    beforeEach(() => {
      kiln = new Kiln()
    })

    it('should add a model', () => {
      kiln.add('user', model)
      kiln.getModels().should.eql({
        user: {
          name: 'user',
          model,
          metadata: {},
          extensions: [],
        },
      })
    })

    it('should add a model with metadata', () => {
      const metadata = {plural: 'accounts'}
      kiln.add('account', model, metadata)
      kiln.getModels().should.eql({
        account: {
          name: 'account',
          model,
          metadata,
          extensions: [],
        },
      })
    })
  })

  describe('#extend', () => {
    let kiln, model

    beforeEach(() => {
      model = {}
      kiln = new Kiln().add('user', model)
    })

    it('should add an extension', () => {
      kiln.extend('user', extensionApi)
      kiln
        .getModels()
        .should.have.deep.property('user.extensions.0')
        .eql({
          extension: extensionApi,
          options: {},
        })
    })

    it('should add an extension with options', () => {
      const options = {foo: 'bar'}
      kiln.extend('user', extensionApi, options)
      kiln
        .getModels()
        .should.have.deep.property('user.extensions.0')
        .eql({
          extension: extensionApi,
          options,
        })
    })

    it('should add a global extension', () => {
      kiln.extend(extensionApi)
      kiln
        .getModels()
        .should.have.deep.property('user.extensions')
        .length(0)
    })
  })

  describe('#bake', () => {
    let kiln, sandbox, extensionABake

    beforeEach(() => {
      kiln = new Kiln()
      sandbox = sinon.sandbox.create()
    })

    function complexKiln() {
      const extensionA = _.defaults({name: 'A'}, extensionApi)
      const extensionB = _.defaults({name: 'B'}, extensionApi)
      const extensionC = _.defaults({name: 'C'}, extensionApi)
      extensionABake = sandbox.stub(extensionA, 'bake')
      extensionABake.returns({resultA: 'foo'})
      sandbox.stub(extensionB, 'bake').returns({resultB: 'bar'})
      sandbox.stub(extensionC, 'bake').returns({resultC: 'baz'})
      delete extensionB.determineDependencies

      kiln
        .add('user', {})
        .extend('user', extensionA)
        .extend('user', extensionB)
        .add('photo', {})
        .extend('photo', extensionC)
    }

    it('should generate for all models and extensions', () => {
      complexKiln()
      kiln.bake().should.eql({
        user: {
          A: {resultA: 'foo'},
          B: {resultB: 'bar'},
        },
        photo: {
          C: {resultC: 'baz'},
        },
      })
    })

    it('should generate global extensions', () => {
      complexKiln()
      const extension = _.defaults({name: 'globalA'}, extensionApi)
      sandbox.stub(extension, 'bake').returns({global: 'value'})
      kiln.extend(extension)

      const results = kiln.bake()
      results.should.have.deep.property('user.globalA.global', 'value')
      results.should.have.deep.property('photo.globalA.global', 'value')
    })

    it('should generate for all extensions', () => {
      complexKiln()
      kiln.bake('user').should.eql({
        A: {resultA: 'foo'},
        B: {resultB: 'bar'},
      })
    })

    it('should generate for a specific model and extension', () => {
      complexKiln()
      kiln.bake('user', 'A').should.eql({resultA: 'foo'})
    })

    it('should generate for a specific model and global extension', () => {
      complexKiln()
      const extension = _.defaults({name: 'globalA'}, extensionApi)
      sandbox.stub(extension, 'bake').returns({global: 'value'})
      kiln.extend(extension)

      kiln.bake('user', 'globalA').should.eql({global: 'value'})
    })

    it('should generate an extension without advanced configuration', () => {
      complexKiln()
      const extension = _.defaults({name: 'cool'}, extensionApi)
      sandbox.stub(extension, 'bake').returns({rando: 'value'})
      kiln.bake('user', extension).should.eql({rando: 'value'})
    })

    it('should create dependencies', () => {
      const dep1Options = {opt: 1}
      const dep2Options = {opt: 2}
      const extensionOptions = {opt: 3}
      const dep1 = _.defaults({name: 'dep1'}, extensionApi)
      const dep2 = _.defaults({name: 'dep2'}, extensionApi)
      const extension = _.defaults({name: 'ext'}, extensionApi)

      const userModel = {user: 1}
      const userOptions = {opt: 'user'}
      const photoModel = {photo: 1}

      const dep1Stub = sandbox.stub(dep1, 'bake')
      const dep2Stub = sandbox.stub(dep2, 'bake')
      const bakeStub = sandbox.stub(extension, 'bake')
      const dependenciesStub = sandbox.stub(extension, 'determineDependencies')
      dep1Stub.returns({result: 'dep1'})
      dep2Stub.returns({result: 'dep2'})
      dependenciesStub.returns(['dep1', 'photo:dep2'])
      bakeStub.returns({result: true})

      kiln
        .add('user', userModel, userOptions)
        .extend('user', dep1, dep1Options)
        .add('photo', photoModel)
        .extend('photo', dep2, dep2Options)

      kiln.bake('user', extension, extensionOptions).should.eql({result: true})
      dep1Stub.should.have.been.calledOnce
      dep2Stub.should.have.been.calledOnce
      dependenciesStub.should.have.been.calledOnce

      const dependenciesArgs = dependenciesStub.firstCall.args
      dependenciesArgs.should.have.deep.property('0.name', 'user')
      dependenciesArgs.should.have.deep.property('0.model', userModel)
      dependenciesArgs.should.have.deep.property('0.metadata', userOptions)
      dependenciesArgs.should.have.property('1', extensionOptions)

      const dep1Args = dep1Stub.firstCall.args
      dep1Args.should.have.deep.property('0.name', 'user')
      dep1Args.should.have.deep.property('0.model', userModel)
      dep1Args.should.have.deep.property('0.metadata', userOptions)
      dep1Args.should.have.property('1').eql(dep1Options)
      dep1Args.should.have.property('2').eql({kiln})

      const dep2Args = dep2Stub.firstCall.args
      dep2Args.should.have.deep.property('0.name', 'photo')
      dep2Args.should.have.deep.property('0.model', photoModel)
      dep2Args.should.have.deep.property('0.metadata').eql({})
      dep2Args.should.have.property('1').eql(dep2Options)
      dep2Args.should.have.property('2').eql({kiln})

      const bakeArgs = bakeStub.firstCall.args
      bakeArgs.should.have.deep.property('0.name', 'user')
      bakeArgs.should.have.deep.property('0.model', userModel)
      bakeArgs.should.have.deep.property('0.metadata', userOptions)
      bakeArgs.should.have.property('1').eql(extensionOptions)
      bakeArgs.should.have
        .property('2')
        .eql({kiln, 'dep1': {result: 'dep1'}, 'photo:dep2': {result: 'dep2'}})
    })

    it('should cache results of already baked extensions', () => {
      complexKiln()
      const resultA = kiln.bake('user', 'A')
      const resultB = kiln.bake('user', 'A')
      resultA.should.equal(resultB)
      extensionABake.should.have.been.calledOnce
    })

    it('should not cache results of already baked extensions with different options', () => {
      complexKiln()
      const resultA = kiln.bake('user', 'A')
      const resultB = kiln.bake('user', 'A', {different: 'option'})
      const resultC = kiln.bake('user', 'A')
      resultA.should.equal(resultB)
      resultB.should.equal(resultC)
      extensionABake.should.have.been.calledThrice
    })

    it('should fail when referencing an unknown model', () => {
      (function () {
        complexKiln()
        kiln.bake('foobar', 'A')
      }.should.throw(Error))
    })
  })

  describe('#clearCache', () => {
    let sandbox

    beforeEach(() => {
      sandbox = sinon.sandbox.create()
    })

    it('should force regeneration of new extensions', () => {
      const extension = _.defaults({name: 'foo'}, extensionApi)
      const kiln = new Kiln().add('user', {}).extend('user', extension)

      const bakeStub = sandbox.stub(extension, 'bake')
      bakeStub
        .onFirstCall()
        .returns({result: 1})
        .onSecondCall()
        .returns({result: 2})

      kiln.bake('user', 'foo')
      const resultA = kiln.bake('user', 'foo')
      kiln.clearCache()
      const resultB = kiln.bake('user', 'foo')
      resultA.should.not.equal(resultB)
      bakeStub.should.have.been.calledTwice
    })
  })

  describe('#reset', () => {
    let sandbox

    beforeEach(() => {
      sandbox = sinon.sandbox.create()
    })

    it('should clear all models', () => {
      const kiln = new Kiln().add('user', {}).add('photo', {})
      kiln.getModels().should.have.property('user')
      kiln.reset()
      kiln.getModels().should.eql({})
    })

    it('should clear the cache', () => {
      const extension = _.defaults({name: 'foo'}, extensionApi)
      const kiln = new Kiln().add('user', {}).extend('user', extension)

      const bakeStub = sandbox.stub(extension, 'bake')
      bakeStub.returns({result: true})
      kiln.bake('user', 'foo')
      bakeStub.should.have.been.calledOnce

      kiln.reset()
      kiln.add('user', {}).extend('user', extension)
      kiln.bake('user', 'foo')
      bakeStub.should.have.been.calledTwice
    })
  })
})
