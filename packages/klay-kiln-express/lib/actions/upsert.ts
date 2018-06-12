import {NextFunction, Request, Response} from 'express'
import {IModel, defaultModelContext} from 'klay-core'
import {IDatabaseExecutor} from 'klay-db'
import {IKilnModel} from 'klay-kiln'

import {creatifyModel} from '../helpers/transform-model'
import {ActionType, IAction, IActionOptions, IAnontatedHandler} from '../typedefs'

import {defaultAction} from './action'

export const upsertAction: IAction = {
  ...defaultAction,
  type: ActionType.Upsert,
  defaultOptions: {
    byList: false,
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
    // TODO: properly handle actionTarget and permissions
    return function(req: Request, res: Response, next: NextFunction): void {
      const payload = req.validated!.body
      res.promise = options.byList ? executor.upsertAll(payload) : executor.upsert(payload)
      next()
    }
  },
}
