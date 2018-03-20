import * as express from 'express'
import {getPrimaryKeyField, IDatabaseExecutor} from 'klay-db'
import {IKilnModel} from 'klay-kiln'
import {
  ActionType,
  IAction,
  IActionOptions,
  IAnontatedHandler,
  IAuthorizationRequired,
} from '../typedefs'

const actionTypesWithTarget = new Set([ActionType.Read, ActionType.Update, ActionType.Destroy])

export const defaultAction = {
  defaultOptions: {},
  authorization(model: IKilnModel, options: IActionOptions): IAuthorizationRequired {
    const getCriteriaValuesFn = ((this as any) as IAction).getCriteriaValues

    let getCriteriaValues
    if (typeof getCriteriaValuesFn === 'function') {
      getCriteriaValues = getCriteriaValuesFn(model, options)
    }

    // TODO: infer permission and criteria from model
    return {permission: '', criteria: [], getCriteriaValues}
  },
  queryModel(model: IKilnModel, options: IActionOptions): undefined {
    return undefined
  },
  paramsModel(model: IKilnModel, options: IActionOptions): undefined {
    return undefined
  },
  bodyModel(model: IKilnModel, options: IActionOptions): undefined {
    return undefined
  },
  lookupActionTarget(
    kilnModel: IKilnModel,
    options: IActionOptions,
    executor: IDatabaseExecutor,
  ): IAnontatedHandler | undefined {
    const actionType = (this as any).type
    if (!actionTypesWithTarget.has(actionType)) return undefined

    const pkField = options.idParamName || getPrimaryKeyField(kilnModel.model)
    const getPkFromItem = (item: any) => (typeof item === 'object' ? item[pkField] : item)
    return async function(
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ): Promise<void> {
      const params = req.validated!.params
      const body = req.validated!.body

      if (options.byList) {
        const ids = (body as any[]).map(getPkFromItem)
        req.actionTarget = await Promise.all(ids.map(id => executor.findByIdOrThrow(id)))
      } else {
        req.actionTarget = await executor.findByIdOrThrow(
          options.byId ? params[pkField] : getPkFromItem(body),
        )
      }

      next()
    }
  },
}
