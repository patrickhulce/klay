import {NextFunction, Request, Response} from 'express'
import defaultModelContext, {IModel, IValidationResult, ModelType} from 'klay-core'
import {IDatabaseExecutor, IQuery, IQueryOrderItem, SortDirection} from 'klay-db'
import {IKilnModel} from 'klay-kiln'
import {forEach, omit, pick} from 'lodash'

import {querifyModel} from '../helpers/transform-model'
import {
  ActionType,
  AuthCriteriaValue,
  GetCriteriaValues,
  IAction,
  IActionOptions,
  IAnontatedHandler,
  ValidateIn,
} from '../typedefs'

import {defaultAction} from './action'

const LIST_OPTIONS = ['limit', 'offset', 'order', 'fields']

function cleanUndefined(object: any, maxDepth: number = 0): void {
  forEach(object, (value, key) => {
    // tslint:disable-next-line
    if (typeof value === 'undefined') delete object[key]
    if (maxDepth && typeof value === 'object') cleanUndefined(value, maxDepth - 1)
  })
}

function stringToOrderItem(s: string): IQueryOrderItem {
  const direction = s.charAt(0) === '-' ? SortDirection.Descending : SortDirection.Ascending
  return {property: s.split('.'), direction}
}

function orderItemsToString(orderItems?: IQueryOrderItem[]): string | undefined {
  if (!orderItems) return undefined
  let out = ''

  for (const orderItem of orderItems) {
    if (orderItem.direction === SortDirection.Descending) out += '-'
    out += orderItem.property.join('.')
  }

  return out
}

function parseOrder(value: IValidationResult): IValidationResult {
  if (typeof value.value === 'string') {
    return value.setValue(value.value.split(',').map(stringToOrderItem))
  } else if (Array.isArray(value.value)) {
    const newArr = value.value.map(
      item => (typeof item === 'string' ? stringToOrderItem(item) : (item as IQueryOrderItem)),
    )

    return value.setValue(newArr)
  }

  return value
}

function parseFields(value: IValidationResult): IValidationResult {
  if (typeof value.value === 'string') {
    return value.setValue(value.value.split(',').map(s => s.split('.')))
  } else if (Array.isArray(value.value)) {
    const newArr = value.value.map(s => (typeof s === 'string' ? s.split('.') : s))
    return value.setValue(newArr)
  }

  return value
}

function listOptionsModel(model: IModel, options: IActionOptions): IModel {
  const filtersModel = querifyModel(model, options)
  const listChildren = {
    limit: defaultModelContext
      .integer()
      .max(options.maxLimit!)
      .default(options.defaultLimit)
      .optional(),
    offset: defaultModelContext
      .integer()
      .min(0)
      .default(0)
      .optional(),
    order: defaultModelContext
      .create({
        type: ModelType.Array,
        default: options.defaultOrder,
        min: 1,
        swagger: {
          alternateModel: defaultModelContext.create({
            type: ModelType.String,
            default: orderItemsToString(options.defaultOrder),
          }),
        },
      })
      .coerce(parseOrder),
    fields: defaultModelContext
      .create({
        type: ModelType.Array,
        swagger: {
          alternateModel: defaultModelContext.create({
            type: ModelType.String,
          }),
        },
      })
      .coerce(parseFields),
  }

  return defaultModelContext
    .object()
    .children(listChildren)
    .merge(filtersModel)
    .strict()
}

export const listAction: IAction = {
  ...defaultAction,
  type: ActionType.List,
  defaultOptions: {
    expectQueryIn: ValidateIn.Query,
    allowQueryByEquality: true,
    allowQueryByInclusion: true,
    allowQueryByRange: [['createdAt'], ['updatedAt']],
    maxLimit: 1000,
    defaultLimit: 10,
  },
  getAffectedCriteriaValues(model: IKilnModel, options: IActionOptions): GetCriteriaValues {
    return function(req: Request, property: string): AuthCriteriaValue[] {
      const payload =
        options.expectQueryIn === ValidateIn.Query ? req.validated!.query : req.validated!.body
      return [payload && payload[property] && payload[property].$eq]
    }
  },
  queryModel(kilnModel: IKilnModel, options: IActionOptions): IModel | undefined {
    return options.expectQueryIn === ValidateIn.Query
      ? listOptionsModel(kilnModel.model, options)
      : undefined
  },
  bodyModel(kilnModel: IKilnModel, options: IActionOptions): IModel | undefined {
    return options.expectQueryIn === ValidateIn.Body
      ? listOptionsModel(kilnModel.model, options)
      : undefined
  },
  responseModel(kilnModel: IKilnModel, options: IActionOptions): IModel | undefined {
    const modelAsArray = defaultModelContext
      .array()
      .children(kilnModel.model)
      .required()
    return defaultModelContext.object().children({
      data: modelAsArray,
      total: defaultModelContext.integer().required(),
    })
  },
  handler(
    kilnModel: IKilnModel,
    options: IActionOptions,
    executor: IDatabaseExecutor,
  ): IAnontatedHandler {
    return function(req: Request, res: Response, next: NextFunction): void {
      const rawQuery = req.validated![options.expectQueryIn!]
      const where = omit(rawQuery, LIST_OPTIONS)
      const query: IQuery = {where, ...pick(rawQuery, LIST_OPTIONS)}
      cleanUndefined(query)
      cleanUndefined(where, 1)

      res.promise = Promise.all([executor.count(query), executor.find(query)]).then(
        ([total, data]) => ({total, data, limit: rawQuery.limit, offset: rawQuery.offset}),
      )

      next()
    }
  },
}
