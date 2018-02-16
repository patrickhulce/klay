const _ = require('lodash')
const expect = require('chai').expect
const sinon = require('sinon')
const Kiln = require('../lib/kiln').Kiln

describe('lib/kiln.ts', () => {
  let kiln
  const model = {isKlayModel: true}
  const extensionApi = {build: _.noop, name: 'extension', options: {}}

  function addModels(kiln) {
    const extensionA = _.defaults({name: 'A'}, extensionApi)
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

  describe('.addModel', () => {
    beforeEach(() => {
      kiln = new Kiln()
    })

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
    const get = (i, name) => kiln.getModels()[i || 0].extensions.get(name || 'extension')

    beforeEach(() => {
      kiln = new Kiln().addModel({name: 'user', model})
    })

    it('should add an extension to specific model', () => {
      kiln.addExtension({modelName: 'user', extension: extensionApi})
      expect(get()).to.eql(extensionApi)
    })

    it('should add a global extension', () => {
      kiln.addModel({name: 'other', model})
      kiln.addExtension({extension: extensionApi})
      expect(get(0)).to.eql(extensionApi)
      expect(get(1)).to.eql(extensionApi)
    })
  })

  describe('.buildAll', () => {
    beforeEach(() => {
      kiln = new Kiln()
      addModels(kiln)
    })

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

    it('should cache results of already baked extensions')

    it('should not cache results of already baked extensions with different options')

    it('should fail when referencing an unknown model', () => {
      expect(() => kiln.buildAll('unknown')).to.throw(/model "unknown"/)
    })
  })

  describe('.build', () => {
    beforeEach(() => {
      kiln = new Kiln()
      addModels(kiln)
    })

    it('should generate for the specified model and extension', () => {
      expect(kiln.build('user', 'A')).to.eql({resultA: 'foo'})
      expect(kiln.build('user', 'B')).to.eql({resultB: 'bar'})
    })

    it('should cache results of already baked extensions')

    it('should not cache results of already baked extensions with different options')

    it('should fail when referencing unknowns', () => {
      expect(() => kiln.build('unknown', 'A')).to.throw(/model "unknown"/)
      expect(() => kiln.build('user', 'unknown')).to.throw(/extension "unknown"/)
    })
  })

  describe('.reset', () => {
    it('should clear the models')
  })
})
