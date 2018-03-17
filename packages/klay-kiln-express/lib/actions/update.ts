import {NextFunction, Request, Response} from 'express'
import {defaultModelContext, IModel} from 'klay-core'
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
    byList: false,
    idParamName: undefined,
  },
  paramsModel(kilnModel: IKilnModel, options: IActionOptions): IModel | undefined {
    return options.byId ? paramifyModel(kilnModel.model, options) : undefined
  },
  bodyModel(kilnModel: IKilnModel, options: IActionOptions): IModel {
    const updateModel = updateifyModel(kilnModel.model)
    const arrayUpdateModel = defaultModelContext
      .array()
      .children(updateModel)
      .required()
      .strict()
    return options.byList ? arrayUpdateModel : updateModel
  },
  handler(
    model: IKilnModel,
    options: IActionOptions,
    executor: IDatabaseExecutor,
  ): IAnontatedHandler {
    if (options.byId && options.byList) {
      throw new Error('Cannot update both byId and byList')
    }

    return function(req: Request, res: Response, next: NextFunction): void {
      const payload = req.validated!.body
      res.promise = options.byList ? executor.updateAll(payload) : executor.update(payload)
      next()
    }
  },
}
