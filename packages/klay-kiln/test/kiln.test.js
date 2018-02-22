const _ = require('lodash')
const expect = require('chai').expect
const sinon = require('sinon')
const Kiln = require('../lib/kiln').Kiln

describe('lib/kiln.ts', () => {
  let kiln, extensionA, extensionApi
  const model = {isKlayModel: true}

  function addModels(kiln) {
    extensionA = _.defaults({name: 'A'}, extensionApi)
    const extensionB = _.defaults({name: 'B'}, extensionApi)
    const extensionC = _.defaults({name: 'C'}, extensionApi)
    sinon.stub(extensionA, 'build').returns({resultA: 'foo'})
    sinon.stub(extensionB, 'build').returns({resultB: 'bar'})
    sinon.stub(extensionC, 'build').returns({resultC: 'baz'})

    kiln
      .addModel({name: 'user', model})
      .addExtension({modelName: 'user', extension: extensionA})
      .addExtension({modelName: 'user', extension: extensionB})
      .addModel({name: 'photo', model})
      .addExtension({modelName: 'photo', extension: extensionC})
  }

  beforeEach(() => {
    kiln = new Kiln()
    extensionApi = {build: _.noop, name: 'extension', defaultOptions: {}}
  })

  describe('.addModel', () => {
    it('should add a model', () => {
      kiln.addModel({name: 'user', model})
      expect(kiln.getModels()).to.eql([
        {
          name: 'user',
          model,
          metadata: {},
          extensions: new Map(),
        },
      ])
    })
  })

  describe('.addExtension', () => {
    const get = (i = 0, name = 'extension') => kiln.getModels()[i].extensions.get(name)

    beforeEach(() => {
      kiln = new Kiln().addModel({name: 'user', model})
    })

    it('should add an extension to specific model', () => {
      kiln.addExtension({modelName: 'user', extension: extensionApi})
      expect(get()).to.eql({extension: extensionApi, options: undefined})
    })

    it('should add a global extension', () => {
      kiln.addModel({name: 'other', model})
      kiln.addExtension({extension: extensionApi})
      expect(get(0)).to.eql({extension: extensionApi, options: undefined})
      expect(get(1)).to.eql({extension: extensionApi, options: undefined})
    })

    it('should not mutate extension options', () => {
      const options = {y: 1}
      kiln.addExtension({extension: extensionApi, options})
      expect(get()).to.eql({extension: extensionApi, options: {y: 1}})
      expect(extensionApi.defaultOptions).to.eql({})
    })
  })

  describe('.buildAll', () => {
    beforeEach(() => addModels(kiln))

    it('should generate for all models and extensions', () => {
      expect(kiln.buildAll()).to.eql([
        {modelName: 'user', extensionName: 'A', value: {resultA: 'foo'}},
        {modelName: 'user', extensionName: 'B', value: {resultB: 'bar'}},
        {modelName: 'photo', extensionName: 'C', value: {resultC: 'baz'}},
      ])
    })

    it('should generate for a specific model and extension', () => {
      expect(kiln.buildAll('user')).to.eql([
        {modelName: 'user', extensionName: 'A', value: {resultA: 'foo'}},
        {modelName: 'user', extensionName: 'B', value: {resultB: 'bar'}},
      ])
    })

    it('should cache results of already baked extensions', () => {
      const value1 = kiln.buildAll('user')[0].value
      expect(value1).to.eql({resultA: 'foo'})
      extensionA.build.restore()
      sinon.stub(extensionA, 'build').returns({busted: true})

      const value2 = kiln.buildAll('user')[0].value
      expect(value2).to.equal(value1)
      expect(value2).to.not.eql({busted: true})

      const value3 = kiln.buildAll()[0].value
      expect(value3).to.equal(value1)
      expect(value2).to.not.eql({busted: true})
    })

    it('should fail when referencing an unknown model', () => {
      expect(() => kiln.buildAll('unknown')).to.throw(/model "unknown"/)
    })
  })

  describe('.build', () => {
    beforeEach(() => addModels(kiln))

    it('should generate for the specified model and extension', () => {
      expect(kiln.build('user', 'A')).to.eql({resultA: 'foo'})
      expect(kiln.build('user', 'B')).to.eql({resultB: 'bar'})
      expect(kiln.build('user', extensionA)).to.eql({resultA: 'foo'})
    })

    it('should use the provided options', () => {
      const extension = {
        name: 'A',
        defaultOptions: {x: 1},
        build(model, options) {
          return options
        },
      }

      kiln.addExtension({extension, options: {y: 1}})
      expect(kiln.build('user', 'A')).to.eql({x: 1, y: 1})
      expect(kiln.build('user', extension)).to.eql({x: 1})
    })

    it('should cache results of already baked extensions', () => {
      const value1 = kiln.build('user', 'A')
      expect(value1).to.eql({resultA: 'foo'})
      extensionA.build.restore()
      sinon.stub(extensionA, 'build').returns({busted: true})

      const value2 = kiln.build('user', 'A')
      expect(value2).to.equal(value1)
      expect(value2).to.not.eql({busted: true})
    })

    it('should not cache results of direct build', () => {
      const value1 = kiln.build('user', extensionA)
      expect(value1).to.eql({resultA: 'foo'})
      extensionA.build.restore()
      sinon.stub(extensionA, 'build').returns({busted: 1})

      const value2 = kiln.build('user', 'A')
      expect(value2).to.not.equal(value1)
      expect(value2).to.eql({busted: 1})
      extensionA.build.restore()
      sinon.stub(extensionA, 'build').returns({busted: 2})

      const value3 = kiln.build('user', extensionA)
      expect(value3).to.not.equal(value2)
      expect(value3).to.eql({busted: 2})
      expect(kiln.build('user', 'A')).to.eql({busted: 1})
    })

    it('should fail when referencing unknowns', () => {
      expect(() => kiln.build('unknown', 'A')).to.throw(/model "unknown"/)
      expect(() => kiln.build('user', 'unknown')).to.throw(/extension "unknown"/)
    })
  })

  describe('.reset', () => {
    beforeEach(() => addModels(kiln))

    it('should clear the models', () => {
      expect(kiln.getModels()).to.have.length(2)
      kiln.reset()
      expect(kiln.getModels()).to.have.length(0)
    })

    it('should clear the cache', () => {
      const value1 = kiln.build('user', 'A')
      expect(value1).to.eql({resultA: 'foo'})

      kiln.reset()
      kiln.addModel({name: 'user', model})
      kiln.addExtension({extension: extensionA})

      extensionA.build.restore()
      sinon.stub(extensionA, 'build').returns({busted: true})

      const value2 = kiln.build('user', 'A')
      expect(value2).to.not.equal(value1)
      expect(value2).to.eql({busted: true})
    })
  })
})
