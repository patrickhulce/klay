import {IModel, modelAssertions} from 'klay-core'

export interface IKiln {
  getModels(): IKilnModel[]
  addModel(model: IKilnModelInput): IKiln
  addExtension(extension: IKilnExtensionInput<any>): IKiln
  build<TResult>(modelName: string, extensionOrName: string | IKilnExtension<TResult, any>): TResult
  build<TResult, TOptions>(
    modelName: string,
    extensionOrName: string | IKilnExtension<TResult, TOptions>,
    options?: TOptions,
  ): TResult
  buildAll(modelName?: string): Array<IKilnResult<any>>
  reset(): IKiln
  clearCache(): IKiln
}

export interface IKilnModelInput {
  name: string
  model: IModel
  meta?: IKilnModelMetadata
}

export interface IKilnModel {
  name: string
  model: IModel
  meta: IKilnModelMetadata
  extensions: Map<string, IKilnExtensionInput<any, any>>
}

// tslint:disable-next-line
export interface IKilnModelMetadata {
  plural?: string
  tableName?: string
}

export interface IKilnResult<T> {
  modelName: string
  extensionName: string
  value: T
}

export interface IKilnExtensionInput<TResult, TOptions = object> {
  defaultOptions?: TOptions
  modelName?: string
  extension: IKilnExtension<TResult, TOptions>
}

export interface IKilnExtension<TResult, TOptions = object> {
  name: string
  defaultOptions: TOptions
  build(kilnModel: IKilnModel, options: TOptions, kiln: IKiln): TResult
}

export type _KilnModelName = string

export type _KilnExtensionName = string

export class Kiln implements IKiln {
  private _models: Map<_KilnModelName, IKilnModel>
  private _cache: Map<_KilnModelName, Map<_KilnExtensionName, IKilnResult<any>>>

  public constructor() {
    this._models = new Map()
    this._cache = new Map()
  }

  private _getModelOrThrow(modelName: string): IKilnModel {
    const kilnModel = this._models.get(modelName)
    modelAssertions.ok(kilnModel, `unable to find model "${modelName}"`)
    return kilnModel!
  }

  private _getExtensionInput<TResult, TOptions>(
    modelName: string,
    extensionName: string,
  ): IKilnExtensionInput<TResult, TOptions> | undefined {
    const kilnModel = this._getModelOrThrow(modelName)
    return kilnModel.extensions.get(extensionName)
  }

  private _getExtensionInputOrThrow<TResult, TOptions>(
    modelName: string,
    extensionName: string,
  ): IKilnExtensionInput<TResult, TOptions> {
    const extension = this._getExtensionInput<TResult, TOptions>(modelName, extensionName)
    modelAssertions.ok(extension, `unable to find extension "${extensionName}"`)
    return extension!
  }

  private _getOrBuild(
    modelName: string,
    extensionName: string,
    options?: object,
  ): IKilnResult<any> {
    const modelCache: Map<_KilnExtensionName, IKilnResult<any>> =
      this._cache.get(modelName) || new Map()
    if (modelCache.has(extensionName) && !options) {
      return modelCache.get(extensionName)!
    }

    const model = this._getModelOrThrow(modelName)
    const {extension, defaultOptions} = this._getExtensionInputOrThrow<any, any>(
      modelName,
      extensionName,
    )
    const buildOptions = {...extension.defaultOptions, ...defaultOptions, ...options}
    const value = extension.build(model, buildOptions, this)
    const result = {modelName, extensionName, value}
    if (!options) modelCache.set(extensionName, result)
    this._cache.set(modelName, modelCache)
    return result
  }

  public getModels(): IKilnModel[] {
    return Array.from(this._models.values())
  }

  public clearCache(): IKiln {
    this._cache = new Map()
    return this
  }

  public reset(): IKiln {
    this._models = new Map()
    this._cache = new Map()
    return this
  }

  public addModel(kilnModel: IKilnModelInput): IKiln {
    modelAssertions.typeof(kilnModel.name, 'string', 'name')
    modelAssertions.ok(kilnModel.model.isKlayModel, 'model must be a klay model')
    modelAssertions.ok(!this._models.has(kilnModel.name), 'model with same name already exists')

    const meta = {plural: `${kilnModel.name}s`, ...kilnModel.meta}
    this._models.set(kilnModel.name, {...kilnModel, meta, extensions: new Map()})
    return this
  }

  public addExtension(input: IKilnExtensionInput<any>): IKiln {
    const {modelName, extension, defaultOptions} = input
    modelAssertions.typeof(extension.name, 'string', 'name')
    modelAssertions.typeof(extension.defaultOptions, 'object', 'options')
    modelAssertions.typeof(extension.build, 'function', 'build')

    if (modelName) {
      this._getModelOrThrow(modelName).extensions.set(extension.name, {extension, defaultOptions})
    } else {
      for (const kilnModel of this._models.values()) {
        kilnModel.extensions.set(extension.name, {extension, defaultOptions})
      }
    }

    return this
  }

  public buildAll(modelName?: string): Array<IKilnResult<any>> {
    const results: Array<IKilnResult<any>> = []
    if (modelName) {
      const kilnModel = this._getModelOrThrow(modelName)
      for (const ext of kilnModel.extensions.values()) {
        results.push(this._getOrBuild(kilnModel.name, ext.extension.name))
      }
    } else {
      for (const kilnModel of this._models.values()) {
        for (const ext of kilnModel.extensions.values()) {
          results.push(this._getOrBuild(kilnModel.name, ext.extension.name))
        }
      }
    }

    return results
  }

  public build<TResult, TOptions = any>(
    modelName: string,
    extensionOrName: string | IKilnExtension<TResult, TOptions>,
    options?: TOptions,
  ): TResult {
    if (typeof extensionOrName === 'object') {
      const model = this._getModelOrThrow(modelName)
      const extension = extensionOrName as IKilnExtension<TResult, TOptions>
      const cachedExtension = this._getExtensionInput<TResult, TOptions>(modelName, extension.name)!
      if (cachedExtension && !options && extension === cachedExtension.extension) {
        return this._getOrBuild(modelName, extension.name, options).value as TResult
      }

      const merged = {...(extension.defaultOptions as any), ...(options as any)}
      return extension.build(model, merged, this) // tslint:disable-line
    }

    return this._getOrBuild(modelName, extensionOrName, options).value as TResult
  }
}
