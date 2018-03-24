import {IModel, IModelChild, ModelType, NumberFormat} from 'klay-core'
import {startCase} from 'lodash'
import * as swagger from 'swagger-schema-official'
import {ValidateIn} from '../typedefs'
import {ISwaggerSchemaCache} from './typedefs'

function setIfDefined(schema: swagger.BaseSchema, key: keyof swagger.BaseSchema, value: any): void {
  if (typeof value !== 'undefined') {
    schema[key] = value
  }
}

function isComplexType(type?: string): boolean {
  return type === ModelType.Array || type === ModelType.Object
}

function buildArraySchema(
  model: IModel,
  cache?: ISwaggerSchemaCache,
  name?: string,
): swagger.Schema {
  return {
    type: 'array',
    items: getSchema(model.spec.children as IModel, cache, `${name}Item`),
  }
}

function buildObjectSchema(
  model: IModel,
  cache?: ISwaggerSchemaCache,
  name?: string,
): swagger.Schema {
  const schema: swagger.Schema = {
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

function buildBaseSchema(model: IModel): swagger.BaseSchema {
  const schema: swagger.BaseSchema = {}

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

function pathToQueryName(path: string[]): string {
  let name = path.shift()!
  while (path.length) {
    name += `[${path.shift()}]`
  }

  return name
}

function flattenModelForParameters(model: IModel, path: string[] = []): IModelChild[] {
  let flattened: IModelChild[] = []

  const children = model.spec.children as IModelChild[]
  for (const child of children) {
    const childPath = [...path, child.path]
    if (isComplexType(child.model.spec.type)) {
      const nested = flattenModelForParameters(child.model, childPath)
      flattened = flattened.concat(nested)
    } else {
      flattened.push({path: pathToQueryName(childPath), model: child.model})
    }
  }

  return flattened
}

export function getSchema(
  model: IModel,
  cache?: ISwaggerSchemaCache,
  name: string = 'Model',
): swagger.Schema {
  if (cache && cache.has(model)) {
    return {$ref: `#/definitions/${cache.get(model)!}`}
  }

  let schema: swagger.Schema
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

  if (cache && isComplexType(model.spec.type)) {
    cache.set(name, model, schema)
    return getSchema(model, cache)
  }

  return schema
}

export function getParameters(
  model: IModel,
  queryIn: ValidateIn,
  cache?: ISwaggerSchemaCache,
  name?: string,
): swagger.Parameter[] {
  if (queryIn === ValidateIn.Body) {
    return [
      {
        name: 'body',
        in: 'body',
        required: !!model.spec.required,
        schema: getSchema(model, cache, name),
      },
    ]
  }

  const parameters: swagger.Parameter[] = []

  let children = model.spec.children as IModelChild[]
  if (queryIn === ValidateIn.Query) children = flattenModelForParameters(model)
  for (const child of children) {
    parameters.push({
      name: child.path,
      in: queryIn === ValidateIn.Params ? 'params' : 'query',
      required: !!child.model.spec.required,
      ...buildBaseSchema(child.model),
    })
  }

  return parameters
}
