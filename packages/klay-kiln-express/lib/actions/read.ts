import {NextFunction, Request, Response} from 'express'
import {IModel} from 'klay'
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
    const pkField = getPrimaryKeyField(kilnModel.model)
    const pkParamName = options.idParamName || pkField
    return function(req: Request, res: Response, next: NextFunction): void {
      const id = get(req.validated!.params, pkParamName)
      res.promise = executor.findByIdOrThrow(id)
      next()
    }
  },
}
