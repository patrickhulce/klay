import {NextFunction, Request, Response} from 'express'
import {IModel} from 'klay-core'
import {IDatabaseExecutor} from 'klay-db'
import {IKilnModel} from 'klay-kiln'

import {paramifyModel, updateifyModel} from '../helpers/transform-model'
import {
  ActionType,
  AuthCriteriaValue,
  GetCriteriaValues,
  IAction,
  IActionOptions,
  IAnontatedHandler,
} from '../typedefs'

import {defaultAction} from './action'

export const patchAction: IAction = {
  ...defaultAction,
  type: ActionType.Patch,
  defaultOptions: {
    byId: true, // MUST be set to true
    idParamName: undefined,
    patchProperties: undefined,
  },
  getAffectedCriteriaValues(model: IKilnModel, options: IActionOptions): GetCriteriaValues {
    return function(req: Request, property: string): AuthCriteriaValue[] {
      const incoming = {...req.actionTarget, ...req.validated!.body}
      return [incoming[property], req.actionTarget[property]]
    }
  },
  paramsModel(kilnModel: IKilnModel, options: IActionOptions): IModel {
    return paramifyModel(kilnModel.model, options)
  },
  bodyModel(kilnModel: IKilnModel, options: IActionOptions): IModel {
    if (!options.patchProperties || !options.patchProperties.length)
      throw new Error('Cannot patch without properties')

    // TODO: assert that properties actually exist on model
    const updateModel = updateifyModel(kilnModel.model)
    return updateModel.pick(options.patchProperties)
  },
  handler(
    model: IKilnModel,
    options: IActionOptions,
    executor: IDatabaseExecutor,
  ): IAnontatedHandler {
    return function(req: Request, res: Response, next: NextFunction): void {
      const payload = req.validated!.body
      const updated = {...req.actionTarget, ...payload}
      res.promise = executor.update(updated)
      next()
    }
  },
}
