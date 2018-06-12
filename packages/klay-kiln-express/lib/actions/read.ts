import {NextFunction, Request, Response} from 'express'
import {IModel} from 'klay-core'
import {IDatabaseExecutor} from 'klay-db'
import {IKilnModel} from 'klay-kiln'

import {paramifyModel} from '../helpers/transform-model'
import {
  ActionType,
  AuthCriteriaValue,
  GetCriteriaValues,
  IAction,
  IActionOptions,
  IAnontatedHandler,
} from '../typedefs'

import {defaultAction} from './action'

export const readAction: IAction = {
  ...defaultAction,
  type: ActionType.Read,
  defaultOptions: {
    byId: true,
    idParamName: undefined,
  },
  getAffectedCriteriaValues(model: IKilnModel, options: IActionOptions): GetCriteriaValues {
    return function(req: Request, property: string): AuthCriteriaValue[] {
      return [req.actionTarget[property]]
    }
  },
  paramsModel(kilnModel: IKilnModel, options: IActionOptions): IModel {
    return paramifyModel(kilnModel.model, options)
  },
  handler(
    kilnModel: IKilnModel,
    options: IActionOptions,
    executor: IDatabaseExecutor,
  ): IAnontatedHandler {
    if (!options.byId) {
      throw new Error('Read must always be byId')
    }

    return function(req: Request, res: Response, next: NextFunction): void {
      res.promise = Promise.resolve(req.actionTarget)
      next()
    }
  },
}
