import {defaultModelContext, IModel, IModelChild, IValidationResult, ModelType} from 'klay-core'
import {ConstraintType, DatabaseEvent, eventMatches, findModel, getPrimaryKeyField} from 'klay-db'
import {flatten, forEach, includes, isEqual} from 'lodash'
import {IParamifyOptions, IQuerifyOptions} from '../typedefs'

const ALLOWED_QUERY_TYPES = [ModelType.Boolean, ModelType.String, ModelType.Number, ModelType.Date]

function omitAll(rootModel: IModel, paths: string[][]): IModel {
  for (const path of paths) {
    const parentPath = path.slice(0, path.length - 1)
    const parentModel = findModel(rootModel, parentPath)
    const childName = path[path.length - 1]
    parentModel.omit([childName])
  }

  return rootModel
}

export function paramifyModel(original: IModel, options?: IParamifyOptions): IModel {
  const model = original.clone()
  const pkField = getPrimaryKeyField(original)
  const paramName = (options && options.idParamName) || pkField
  const children = model.spec.children as IModelChild[]
  const pkModel = children
    .find(child => child.path === pkField)!
    .model
    .strict(false)
    .required()
  model.spec = {}
  return model.type(ModelType.Object).children({[paramName]: pkModel})
}

export function creatifyModel(original: IModel): IModel {
  const model = original.clone()
  const automanage = model.spec.db!.automanage
  const automanagedPaths = automanage
    .filter(item => eventMatches(item.event, DatabaseEvent.Create))
    .map(item => item.property)
  return omitAll(model, automanagedPaths)
}

export function updateifyModel(original: IModel): IModel {
  const model = original.clone()
  const constraints = model.spec.db!.constrain
  const automanage = model.spec.db!.automanage
  const automanagedPaths = automanage
    .filter(item => eventMatches(item.event, DatabaseEvent.Update))
    .map(item => item.property)
  const immutableProperties = constraints
    .filter(item => item.type === ConstraintType.Immutable)
    .map(item => item.properties)

  const mergedPaths = [...automanagedPaths, ...flatten(immutableProperties)]
  for (const path of mergedPaths) {
    const childModel = findModel(model, path)
    childModel.optional()
  }

  return model
}

function parseQueryFilter(value: IValidationResult): IValidationResult {
  if (typeof value.value === 'object' || typeof value.value === 'undefined') {
    return value
  }

  return value.setValue({$eq: value.value})
}

function isAllowed(allowBoolOrArray: boolean | string[][] | undefined, path: string[]): boolean {
  if (typeof allowBoolOrArray === 'boolean' || !allowBoolOrArray) {
    return !!allowBoolOrArray
  }

  return allowBoolOrArray.some(item => isEqual(item, path))
}

export function querifyModel(original: IModel, options: IQuerifyOptions): IModel {
  const children: any = {}

  forEach(original.spec.children as IModelChild[], child => {
    const filterKeys: string[] = []

    if (isAllowed(options.allowQueryByEquality, [child.path])) {
      filterKeys.push('$eq', '$ne')
      if (child.model.spec.type === 'string') {
        filterKeys.push('$match')
      }
    }

    if (isAllowed(options.allowQueryByRange, [child.path])) {
      filterKeys.push('$lt', '$gt', '$gte', '$lte')
    }

    if (isAllowed(options.allowQueryByInclusion, [child.path])) {
      filterKeys.push('$in', '$nin')
    }

    // TODO: allow nested querying
    if (!filterKeys.length || !includes(ALLOWED_QUERY_TYPES, child.model.spec.type)) return

    const valueModel = child.model
      .clone()
      .optional()
      .default()
      .strict(false)

    const filterChildren = filterKeys.map(key => {
      let model = valueModel

      if (key === '$match') {
        model = defaultModelContext.string().optional()
      }

      if (key === '$in' || key === '$nin') {
        model = defaultModelContext
          .array()
          .children(valueModel)
          .coerce(vr => (typeof vr.value === 'string' ? vr.setValue(vr.value.split(',')) : vr))
      }

      return {path: key, model}
    })

    children[child.path] = defaultModelContext
      .object()
      .coerce(parseQueryFilter)
      .children(filterChildren)
      .optional()
      .strict()
  })

  return defaultModelContext
    .object()
    .children(children)
    .strict()
}
