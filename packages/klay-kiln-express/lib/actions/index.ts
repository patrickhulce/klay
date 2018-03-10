import {IAction} from '../typedefs'
import {createAction} from './create'
import {upsertAction} from './upsert'
import {updateAction} from './update'

export const actions: IAction[] = [
  createAction,
  upsertAction,
  updateAction,
]
