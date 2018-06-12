import {NextFunction, Request, Response} from 'express'
import defaultModelContext, {IModel} from 'klay-core'
import {IDatabaseExecutor} from 'klay-db'
import {IKilnModel} from 'klay-kiln'

import {creatifyModel} from '../helpers/transform-model'
import {
  ActionType,
  AuthCriteriaValue,
  GetCriteriaValues,
  IAction,
  IActionOptions,
  IAnontatedHandler,
} from '../typedefs'

import {defaultAction} from './action'

export const createAction: IAction = {
  ...defaultAction,
  type: ActionType.Create,
  defaultOptions: {
    byList: false,
  },
  getAffectedCriteriaValues(model: IKilnModel, options: IActionOptions): GetCriteriaValues {
    return function(req: Request, property: string): AuthCriteriaValue[] {
      const items: any[] = [].concat(req.validated!.body)
      return items.map(item => item[property])
    }
  },
  bodyModel(kilnModel: IKilnModel, options: IActionOptions): IModel {
    const createModel = creatifyModel(kilnModel.model)
    const arrayCreateModel = defaultModelContext
      .array()
      .children(createModel)
      .required()
      .strict()
    return options.byList ? arrayCreateModel : createModel
  },
  handler(
    model: IKilnModel,
    options: IActionOptions,
    executor: IDatabaseExecutor,
  ): IAnontatedHandler {
    return function(req: Request, res: Response, next: NextFunction): void {
      const payload = req.validated!.body
      res.promise = options.byList ? executor.createAll(payload) : executor.create(payload)
      next()
    }
  },
}
