import {IModel} from 'klay-core'
import {Schema, Path} from 'swagger-schema-official'

export interface IKeyedSchema {
  [key: string]: Schema
}

export interface IKeyedPaths {
  [key: string]: Path
}

export interface ISwaggerSchemaCache {
  has(model: IModel): boolean
  get(model: IModel): string | undefined
  set(name: string, model: IModel, schema: Schema): void
  getUniqueSchemas(): IKeyedSchema
}
