import {NextFunction, Request, Response} from 'express'
import {defaultModelContext, IModel} from 'klay-core'
import {findModel, getPrimaryKeyField, IDatabaseExecutor, PrimaryKey} from 'klay-db'
import {IKilnModel} from 'klay-kiln'
import {get} from 'lodash'
import {paramifyModel} from '../helpers/transform-model'
import {ActionType, IAction, IActionOptions, IAnontatedHandler} from '../typedefs'
import {defaultAction} from './action'

async function destroyById(executor: IDatabaseExecutor, id: PrimaryKey): Promise<void> {
  await executor.findByIdOrThrow(id)
  await executor.destroyById(id)
}

async function destroyAll(executor: IDatabaseExecutor, ids: PrimaryKey[]): Promise<void> {
  await executor.transaction(async transaction => {
    await Promise.all(ids.map(id => executor.destroyById(id, {transaction})))
  })
}

export const destroyAction: IAction = {
  ...defaultAction,
  type: ActionType.Destroy,
  defaultOptions: {
    byId: true,
    byList: false,
    idParamName: undefined,
  },
  paramsModel(kilnModel: IKilnModel, options: IActionOptions): IModel | undefined {
    return options.byId ? paramifyModel(kilnModel.model, options) : undefined
  },
  bodyModel(kilnModel: IKilnModel, options: IActionOptions): IModel | undefined {
    if (options.byId) return
    const pkField = getPrimaryKeyField(kilnModel.model)
    const pkModel = findModel(kilnModel.model, [pkField])
    const arrayPkModel = defaultModelContext
      .array()
      .children(pkModel)
      .required()
    return options.byList ? arrayPkModel : pkModel
  },
  handler(
    kilnModel: IKilnModel,
    options: IActionOptions,
    executor: IDatabaseExecutor,
  ): IAnontatedHandler {
    const pkField = getPrimaryKeyField(kilnModel.model)
    const pkParamName = options.idParamName || pkField
    return function(req: Request, res: Response, next: NextFunction): void {
      const id = options.byId ? get(req.validated, ['params', pkParamName]) : req.validated!.body
      const ids = req.validated!.body
      res.promise = options.byList ? destroyAll(executor, ids) : destroyById(executor, id)

      next()
    }
  },
}
