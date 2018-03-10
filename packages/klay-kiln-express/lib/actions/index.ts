import {IAction} from '../typedefs'
import {createAction} from './create'
import {updateAction} from './update'
import {upsertAction} from './upsert'
import {readAction} from './read'

export const actions: IAction[] = [
  createAction,
  readAction,
  updateAction,
  upsertAction,
]
