import {IModel} from 'klay-core'
import {Path, Schema} from 'swagger-schema-official'

export enum SwaggerContext {
  Schema = 'schema',
  Query = 'query',
}

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

export interface ISwaggerModelOptions {
  schemaName?: string
  inline?: boolean
  alternateModel?: IModel
  alternateQueryModel?: IModel
}
