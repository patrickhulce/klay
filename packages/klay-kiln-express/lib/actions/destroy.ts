import {NextFunction, Request, Response} from 'express'
import {defaultModelContext, IModel} from 'klay-core'
import {findModel, getPrimaryKeyField, IDatabaseExecutor, PrimaryKey} from 'klay-db'
import {IKilnModel} from 'klay-kiln'
import {get} from 'lodash'
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
  getCriteriaValues(model: IKilnModel, options: IActionOptions): GetCriteriaValues {
    return function(req: Request, property: string): AuthCriteriaValue[] {
      const items: any[] = [].concat(req.actionTarget)
      return items.map(item => item[property])
    }
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
    if (options.byId && options.byList) {
      throw new Error('Cannot update both byId and byList')
    }

    const pkField = getPrimaryKeyField(kilnModel.model)
    const pkParamName = options.idParamName || pkField
    return function(req: Request, res: Response, next: NextFunction): void {
      const id = options.byId ? get(req.validated, ['params', pkParamName]) : req.validated!.body
      const ids = req.validated!.body
      res.promise = options.byList ? destroyAll(executor, ids) : executor.destroyById(id)

      next()
    }
  },
}
