import {NextFunction, Request, Response} from 'express'
import {IModel} from 'klay-core'
import {getPrimaryKeyField, IDatabaseExecutor} from 'klay-db'
import {IKilnModel} from 'klay-kiln'
import {get} from 'lodash'
import {paramifyModel} from '../helpers/transform-model'
import {ActionType, IAction, IActionOptions, IAnontatedHandler} from '../typedefs'
import {defaultAction} from './action'

export const readAction: IAction = {
  ...defaultAction,
  type: ActionType.Read,
  defaultOptions: {
    idParamName: undefined,
  },
  paramsModel(kilnModel: IKilnModel, options: IActionOptions): IModel {
    return paramifyModel(kilnModel.model, options)
  },
  handler(
    kilnModel: IKilnModel,
    options: IActionOptions,
    executor: IDatabaseExecutor,
  ): IAnontatedHandler {
    return function(req: Request, res: Response, next: NextFunction): void {
      res.promise = Promise.resolve(req.actionTarget)
      next()
    }
  },
}
