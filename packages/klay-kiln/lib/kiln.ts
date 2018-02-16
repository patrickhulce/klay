import {IModel, modelAssertions} from 'klay'

export interface IKiln {
  getModels(): IKilnModel[]
  addModel(model: IKilnModelInput): IKiln
  addExtension(extension: IKilnExtensionInput<any>): IKiln
  build<T>(modelName: string, extensionOrName: string | IKilnExtension<T>): T
  buildAll(modelName?: string): Array<IKilnResult<any>>
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

// tslint:disable-next-line
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
  result: IKilnResult<any>
}

export class Kiln implements IKiln {
  private _models: Map<string, IKilnModel>
  private _cache: Map<string, Map<string, IKilnResult<any>>>

  public constructor() {
    this._models = new Map()
    this._cache = new Map()
  }

  private _getModelOrThrow(modelName: string): IKilnModel {
    const kilnModel = this._models.get(modelName)
    modelAssertions.ok(kilnModel, `unable to find model "${modelName}"`)
    return kilnModel!
  }

  private _getExtensionOrThrow(modelName: string, extensionName: string): IKilnExtension<any> {
    const kilnModel = this._getModelOrThrow(modelName)
    const extension = kilnModel.extensions.get(extensionName)!
    modelAssertions.ok(extension, `unable to find extension "${extensionName}"`)
    return extension
  }

  private _getOrBuild(modelName: string, extensionName: string): IKilnResult<any> {
    const modelCache: Map<string, IKilnResult<any>> = this._cache.get(modelName) || new Map()
    if (modelCache.has(extensionName)) {
      return modelCache.get(extensionName)!
    }

    const model = this._getModelOrThrow(modelName)
    const extension = this._getExtensionOrThrow(modelName, extensionName)
    const value = extension.build(model, extension.options, this)
    const result = {modelName, extensionName, value}
    modelCache.set(extensionName, result)
    this._cache.set(modelName, modelCache)
    return result
  }

  public getModels(): IKilnModel[] {
    return Array.from(this._models.values())
  }

  public reset(): IKiln {
    this._models = new Map()
    this._cache = new Map()
    return this
  }

  public addModel(model: IKilnModelInput): IKiln {
    modelAssertions.typeof(model.name, 'string', 'name')
    modelAssertions.ok(model.model.isKlayModel, 'model must be a klay model')
    modelAssertions.ok(!this._models.has(model.name), 'model with same name already exists')

    this._models.set(model.name, {metadata: {}, ...model, extensions: new Map()})
    return this
  }

  public addExtension(input: IKilnExtensionInput<any>): IKiln {
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

  public buildAll(modelName?: string): Array<IKilnResult<any>> {
    const results: Array<IKilnResult<any>> = []
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

  public build<T>(modelName: string, extensionOrName: string | IKilnExtension<T>): T {
    if (typeof extensionOrName === 'object') {
      const model = this._getModelOrThrow(modelName)
      const extension = extensionOrName as IKilnExtension<T>
      return extension.build(model, extension.options, this) as T
    }

    return this._getOrBuild(modelName, extensionOrName).value as T
  }
}
