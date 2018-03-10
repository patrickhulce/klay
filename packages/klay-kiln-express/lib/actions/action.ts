import {IKilnModel} from 'klay-kiln'
import {IActionOptions} from '../typedefs'

export const defaultAction = {
  defaultOptions: {},
  queryModel(model: IKilnModel, options: IActionOptions): undefined {
    return undefined
  },
  paramsModel(model: IKilnModel, options: IActionOptions): undefined {
    return undefined
  },
  bodyModel(model: IKilnModel, options: IActionOptions): undefined {
    return undefined
  },
}
