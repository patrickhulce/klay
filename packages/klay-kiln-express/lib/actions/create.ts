import {NextFunction, Request, Response} from 'express'
import {IModel} from 'klay-core'
import {IDatabaseExecutor} from 'klay-db'
import {IKilnModel} from 'klay-kiln'
import {creatifyModel} from '../helpers/transform-model'
import {ActionType, IAction, IActionOptions, IAnontatedHandler} from '../typedefs'
import {defaultAction} from './action'

export const createAction: IAction = {
  ...defaultAction,
  type: ActionType.Create,
  bodyModel(kilnModel: IKilnModel, options: IActionOptions): IModel {
    return creatifyModel(kilnModel.model)
  },
  handler(
    model: IKilnModel,
    options: IActionOptions,
    executor: IDatabaseExecutor,
  ): IAnontatedHandler {
    return function(req: Request, res: Response, next: NextFunction): void {
      const payload = req.validated!.body
      res.promise = executor.create(payload)
      next()
    }
  },
}
