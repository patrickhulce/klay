import {IModel} from 'klay-core'
import {isEqual} from 'lodash'
import {Schema} from 'swagger-schema-official'
import {IKeyedSchema, ISwaggerSchemaCache} from './typedefs'

export class SwaggerSchemaCache implements ISwaggerSchemaCache {
  private readonly _modelCache: Map<IModel, string>
  private readonly _cache: Map<string, Schema>

  public constructor() {
    this._cache = new Map()
    this._modelCache = new Map()
  }

  public has(model: IModel): boolean {
    return !!this.get(model)
  }

  public get(model: IModel): string | undefined {
    if (this._modelCache.has(model)) {
      return this._modelCache.get(model)
    }

    for (const [candidate, name] of this._modelCache.entries()) {
      if (isEqual(candidate, model)) {
        this._modelCache.set(model, name)
        return name
      }
    }
  }

  public set(name: string, model: IModel, schema: Schema): void {
    for (const [candidateName, candidateSchema] of this._cache.entries()) {
      if (isEqual(candidateSchema, schema)) {
        this._modelCache.set(model, candidateName)
        return
      }
    }

    this._modelCache.set(model, name)
    this._cache.set(name, schema)
  }

  public getUniqueSchemas(): IKeyedSchema {
    const schemas: IKeyedSchema = {}
    for (const [key, schema] of this._cache.entries()) {
      schemas[key] = schema
    }

    return schemas
  }
}
