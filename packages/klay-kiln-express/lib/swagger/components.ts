import {IModel, IModelChild, ModelType, NumberFormat} from 'klay-core'
import {startCase} from 'lodash'
import {BaseSchema, Schema} from 'swagger-schema-official'
import {ISwaggerSchemaCache} from './typedefs'

function setIfDefined(schema: BaseSchema, key: keyof BaseSchema, value: any): void {
  if (typeof value !== 'undefined') {
    schema[key] = value
  }
}

function buildArraySchema(model: IModel, cache?: ISwaggerSchemaCache, name?: string): Schema {
  return {
    type: 'array',
    items: getSchema(model.spec.children as IModel, cache, `${name}Item`),
  }
}

function buildObjectSchema(model: IModel, cache?: ISwaggerSchemaCache, name?: string): Schema {
  const schema: Schema = {
    type: 'object',
    properties: {},
  }

  const required = []
  const children = (model.spec.children as IModelChild[]) || []
  for (const child of children) {
    const childName = startCase(child.path).replace(/ +/g, '')
    schema.properties![child.path] = getSchema(child.model, cache, `${name}${childName}`)
    if (child.model.spec.required) {
      required.push(child.path)
    }
  }

  if (required.length) {
    schema.required = required
  }

  return schema
}

function buildBaseSchema(model: IModel): BaseSchema {
  const schema: BaseSchema = {}

  switch (model.spec.type) {
    case ModelType.Object:
    case ModelType.Array:
      throw new TypeError('Cannot create base schema for complex type')
    case ModelType.Number:
      if (model.spec.format === NumberFormat.Integer) {
        schema.type = 'integer'
        schema.format = model.spec.max! < 3e9 ? 'int32' : 'int64'
      } else {
        schema.type = 'number'
        schema.format = 'double'
      }

      setIfDefined(schema, 'minimum', model.spec.min)
      setIfDefined(schema, 'maximum', model.spec.max)
      break
    case ModelType.String:
      schema.type = 'string'
      setIfDefined(schema, 'minLength', model.spec.min)
      setIfDefined(schema, 'maxLength', model.spec.max)
      break
    case ModelType.Boolean:
      schema.type = 'boolean'
      break
    case ModelType.Date:
      // TODO: handle date-only
      schema.type = 'string'
      schema.format = 'date-time'
      break
    default:
      // TODO: provide option to throw
      schema.type = 'string'
  }

  setIfDefined(schema, 'default', model.spec.default)
  setIfDefined(schema, 'enum', model.spec.enum) // TODO: handle enum models
  return schema
}

export function getSchema(
  model: IModel,
  cache?: ISwaggerSchemaCache,
  name: string = 'Model',
): Schema {
  if (cache && cache.has(model)) {
    return {$ref: `#/definitions/${cache.get(model)!}`}
  }

  let schema: Schema
  switch (model.spec.type) {
    case ModelType.Object:
      schema = buildObjectSchema(model, cache, name)
      break
    case ModelType.Array:
      schema = buildArraySchema(model, cache, name)
      break
    default:
      schema = buildBaseSchema(model)
  }

  const isComplex = schema.type === 'array' || schema.type === 'object'
  if (cache && isComplex) {
    cache.set(name, model, schema)
  }

  return schema
}
