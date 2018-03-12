import {NextFunction, Request, Response} from 'express'
import {IModel} from 'klay'
import {IDatabaseExecutor} from 'klay-db'
import {IKilnModel} from 'klay-kiln'
import {paramifyModel, updateifyModel} from '../helpers/transform-model'
import {ActionType, IAction, IActionOptions, IAnontatedHandler} from '../typedefs'
import {defaultAction} from './action'

export const updateAction: IAction = {
  ...defaultAction,
  type: ActionType.Update,
  defaultOptions: {
    byId: true,
    idParamName: undefined,
  },
  paramsModel(kilnModel: IKilnModel, options: IActionOptions): IModel | undefined {
    return options.byId ? paramifyModel(kilnModel.model, options) : undefined
  },
  bodyModel(kilnModel: IKilnModel, options: IActionOptions): IModel {
    return updateifyModel(kilnModel.model)
  },
  handler(
    model: IKilnModel,
    options: IActionOptions,
    executor: IDatabaseExecutor,
  ): IAnontatedHandler {
    return function(req: Request, res: Response, next: NextFunction): void {
      const payload = req.validated!.body
      res.promise = executor.update(payload)
      next()
    }
  },
}
