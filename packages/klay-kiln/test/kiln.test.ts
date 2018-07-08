const _ = require('lodash')

const Kiln = require('../lib/kiln').Kiln

describe('lib/kiln.ts', () => {
  let kiln, extensionA, extensionApi
  const model = {isKlayModel: true}

  function addModels(kiln) {
    extensionA = _.defaults({name: 'A'}, extensionApi)
    const extensionB = _.defaults({name: 'B'}, extensionApi)
    const extensionC = _.defaults({name: 'C'}, extensionApi)
    jest.spyOn(extensionA, 'build').mockReturnValue({resultA: 'foo'})
    jest.spyOn(extensionB, 'build').mockReturnValue({resultB: 'bar'})
    jest.spyOn(extensionC, 'build').mockReturnValue({resultC: 'baz'})

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
      expect(kiln.getModels()).toEqual([
        {
          name: 'user',
          model,
          meta: {plural: 'users'},
          extensions: new Map(),
        },
      ])
    })

    it('should add a model with custom meta', () => {
      kiln.addModel({name: 'activity', model, meta: {plural: 'activities'}})
      expect(kiln.getModels()).toEqual([
        {
          name: 'activity',
          model,
          meta: {plural: 'activities'},
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
      expect(get()).toEqual({extension: extensionApi, defaultOptions: undefined})
    })

    it('should add a global extension', () => {
      kiln.addModel({name: 'other', model})
      kiln.addExtension({extension: extensionApi})
      expect(get(0)).toEqual({extension: extensionApi, defaultOptions: undefined})
      expect(get(1)).toEqual({extension: extensionApi, defaultOptions: undefined})
    })

    it('should not mutate extension options', () => {
      const defaultOptions = {y: 1}
      kiln.addExtension({extension: extensionApi, defaultOptions})
      expect(get()).toEqual({extension: extensionApi, defaultOptions: {y: 1}})
      expect(extensionApi.defaultOptions).toEqual({})
    })
  })

  describe('.buildAll', () => {
    beforeEach(() => addModels(kiln))

    it('should generate for all models and extensions', () => {
      expect(kiln.buildAll()).toEqual([
        {modelName: 'user', extensionName: 'A', value: {resultA: 'foo'}},
        {modelName: 'user', extensionName: 'B', value: {resultB: 'bar'}},
        {modelName: 'photo', extensionName: 'C', value: {resultC: 'baz'}},
      ])
    })

    it('should generate for a specific model and extension', () => {
      expect(kiln.buildAll('user')).toEqual([
        {modelName: 'user', extensionName: 'A', value: {resultA: 'foo'}},
        {modelName: 'user', extensionName: 'B', value: {resultB: 'bar'}},
      ])
    })

    it('should cache results of already baked extensions', () => {
      const value1 = kiln.buildAll('user')[0].value
      expect(value1).toEqual({resultA: 'foo'})
      extensionA.build.mockRestore()
      jest.spyOn(extensionA, 'build').mockReturnValue({busted: true})

      const value2 = kiln.buildAll('user')[0].value
      expect(value2).toBe(value1)
      expect(value2).not.toEqual({busted: true})

      const value3 = kiln.buildAll()[0].value
      expect(value3).toBe(value1)
      expect(value2).not.toEqual({busted: true})
    })

    it('should fail when referencing an unknown model', () => {
      expect(() => kiln.buildAll('unknown')).toThrowError(/model "unknown"/)
    })
  })

  describe('.build', () => {
    beforeEach(() => addModels(kiln))

    it('should generate for the specified model and extension', () => {
      expect(kiln.build('user', 'A')).toEqual({resultA: 'foo'})
      expect(kiln.build('user', 'B')).toEqual({resultB: 'bar'})
      expect(kiln.build('user', extensionA)).toEqual({resultA: 'foo'})
    })

    it('should use the provided options', () => {
      const extension = {
        name: 'A',
        defaultOptions: {x: 1},
        build(model, options) {
          return options
        },
      }

      kiln.addExtension({extension, defaultOptions: {y: 1}})
      expect(kiln.build('user', 'A')).toEqual({x: 1, y: 1})
      expect(kiln.build('user', 'A', {z: 1})).toEqual({x: 1, y: 1, z: 1})
      expect(kiln.build('user', {...extension})).toEqual({x: 1})
      expect(kiln.build('user', extension, {z: 1})).toEqual({x: 1, z: 1})
    })

    it('should cache results of already baked extensions', () => {
      const value1 = kiln.build('user', 'A')
      expect(value1).toEqual({resultA: 'foo'})
      extensionA.build.mockRestore()
      jest.spyOn(extensionA, 'build').mockReturnValue({busted: true})

      const value2 = kiln.build('user', 'A')
      expect(value2).toBe(value1)
      expect(value2).not.toEqual({busted: true})
    })

    it('should cache results of direct build when ===', () => {
      const value1 = kiln.build('user', extensionA)
      expect(value1).toEqual({resultA: 'foo'})
      extensionA.build.mockRestore()
      jest.spyOn(extensionA, 'build').mockReturnValue({busted: 1})

      const value2 = kiln.build('user', 'A')
      expect(value2).toBe(value1)

      const value3 = kiln.build('user', extensionA)
      expect(value3).toBe(value1)
      expect(kiln.build('user', 'A')).toEqual(value1)
    })

    it('should not cache results of direct build when !==', () => {
      const extensionALike = _.defaults({name: 'A'}, extensionApi)
      jest.spyOn(extensionALike, 'build').mockReturnValue({busted: 1})

      const value1 = kiln.build('user', extensionALike)
      expect(value1).toEqual({busted: 1})

      const value2 = kiln.build('user', 'A')
      expect(value2).toEqual({resultA: 'foo'})
      extensionALike.build.mockRestore()
      jest.spyOn(extensionALike, 'build').mockReturnValue({busted: 2})

      const value3 = kiln.build('user', extensionALike)
      expect(value3).toEqual({busted: 2})
      extensionA.build.mockRestore()
      jest.spyOn(extensionA, 'build').mockReturnValue({busted: 3})
      expect(kiln.build('user', 'A')).toEqual({resultA: 'foo'})
    })

    it('should fail when referencing unknowns', () => {
      expect(() => kiln.build('unknown', 'A')).toThrowError(/model "unknown"/)
      expect(() => kiln.build('user', 'unknown')).toThrowError(/extension "unknown"/)
    })
  })

  describe('.reset', () => {
    beforeEach(() => addModels(kiln))

    it('should clear the models', () => {
      expect(kiln.getModels()).toHaveLength(2)
      kiln.reset()
      expect(kiln.getModels()).toHaveLength(0)
    })

    it('should clear the cache', () => {
      const value1 = kiln.build('user', 'A')
      expect(value1).toEqual({resultA: 'foo'})

      kiln.reset()
      kiln.addModel({name: 'user', model})
      kiln.addExtension({extension: extensionA})

      extensionA.build.mockRestore()
      jest.spyOn(extensionA, 'build').mockReturnValue({busted: true})

      const value2 = kiln.build('user', 'A')
      expect(value2).not.toBe(value1)
      expect(value2).toEqual({busted: true})
    })
  })

  describe('.clearCache', () => {
    beforeEach(() => addModels(kiln))

    it('should clear the cache', () => {
      const value1 = kiln.build('user', 'A')
      expect(value1).toEqual({resultA: 'foo'})

      kiln.clearCache()

      extensionA.build.mockRestore()
      jest.spyOn(extensionA, 'build').mockReturnValue({busted: true})

      const value2 = kiln.build('user', 'A')
      expect(value2).not.toBe(value1)
      expect(value2).toEqual({busted: true})
    })
  })
})
