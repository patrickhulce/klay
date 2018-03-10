import {IAction} from '../typedefs'
import {createAction} from './create'
import {updateAction} from './update'
import {upsertAction} from './upsert'

export const actions: IAction[] = [
  createAction,
  updateAction,
  upsertAction,
]
