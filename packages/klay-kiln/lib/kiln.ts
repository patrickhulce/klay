import {IModel, modelAssertions} from 'klay'
import {isEqual} from 'lodash'

export interface IKiln {
  getModels(): IKilnModel[]
  addModel(model: IKilnModelInput): IKiln
  addExtension(extension: IKilnExtensionInput<any>): IKiln
  build<T>(modelName: string, extensionName: string): IKilnResult<T>
  buildAll(modelName?: string): IKilnResult<any>[]
}

export interface IKilnModelInput {
  name: string
  model: IModel
  metadata?: IKilnModelMetadata
}

export interface IKilnModel {
  name: string
  model: IModel
  metadata: IKilnModelMetadata
  extensions: Map<string, IKilnExtension<any>>
}

export interface IKilnModelMetadata {}

export interface IKilnResult<T> {
  modelName: string
  extensionName: string
  value: T
}

export interface IKilnExtensionInput<T> {
  options?: object
  modelName?: string
  extension: IKilnExtension<T>
}

export interface IKilnExtension<T> {
  name: string
  options: object
  build(kilnModel: IKilnModel, options: object, kiln: IKiln): T
}

interface ICacheEntry {
  options: object
  value: IKilnResult<any>
}

export class Kiln implements IKiln {
  private _models: Map<string, IKilnModel>
  private _cache: Map<string, Map<string, ICacheEntry[]>>

  public constructor() {
    this._models = new Map()
    this._cache = new Map()
  }

  _getModelOrThrow(modelName: string): IKilnModel {
    const kilnModel = this._models.get(modelName)
    modelAssertions.ok(kilnModel, `unable to find model "${modelName}"`)
    return kilnModel!
  }

  _getExtensionOrThrow(modelName: string, extensionName: string): IKilnExtension<any> {
    const kilnModel = this._getModelOrThrow(modelName)
    const extension = kilnModel.extensions.get(extensionName)!
    modelAssertions.ok(extension, `unable to find extension "${extensionName}"`)
    return extension
  }

  private _getOrBuild(modelName: string, extensionName: string): IKilnResult<any> {
    const modelCache: Map<string, ICacheEntry[]> = this._cache.get(modelName) || new Map()
    const extensionCache = modelCache.get(extensionName) || []
    if (extensionCache.length) {
      const value = extensionCache[0].value
      return {modelName, extensionName, value}
    }

    const model = this._getModelOrThrow(modelName)
    const extension = this._getExtensionOrThrow(modelName, extensionName)
    const value = extension.build(model, extension.options, this)
    extensionCache.push({value, options: extension.options})
    modelCache.set(extensionName, extensionCache)
    this._cache.set(modelName, modelCache)
    return {modelName, extensionName, value}
  }

  getModels(): IKilnModel[] {
    return Array.from(this._models.values())
  }

  reset(): IKiln {
    this._models = new Map()
    this._cache = new Map()
    return this
  }

  addModel(model: IKilnModelInput): IKiln {
    modelAssertions.typeof(model.name, 'string', 'name')
    modelAssertions.ok(model.model.isKlayModel, 'model must be a klay model')
    modelAssertions.ok(!this._models.has(model.name), 'model with same name already exists')

    this._models.set(model.name, {metadata: {}, ...model, extensions: new Map()})
    return this
  }

  addExtension(input: IKilnExtensionInput<any>): IKiln {
    const {modelName, extension, options} = input
    modelAssertions.typeof(extension.name, 'string', 'name')
    modelAssertions.typeof(extension.options, 'object', 'options')
    modelAssertions.typeof(extension.build, 'function', 'build')
    extension.options = {...extension.options, ...options}

    if (modelName) {
      this._getModelOrThrow(modelName).extensions.set(extension.name, extension)
    } else {
      for (const kilnModel of this._models.values()) {
        kilnModel.extensions.set(extension.name, extension)
      }
    }

    return this
  }

  buildAll(modelName?: string): IKilnResult<any>[] {
    const results: IKilnResult<any>[] = []
    if (modelName) {
      const kilnModel = this._getModelOrThrow(modelName)
      for (const extension of kilnModel.extensions.values()) {
        results.push(this._getOrBuild(kilnModel.name, extension.name))
      }
    } else {
      for (const kilnModel of this._models.values()) {
        for (const extension of kilnModel.extensions.values()) {
          results.push(this._getOrBuild(kilnModel.name, extension.name))
        }
      }
    }

    return results
  }

  build<T>(modelName: string, extensionName: string): T {
    return this._getOrBuild(modelName, extensionName).value
  }
}
