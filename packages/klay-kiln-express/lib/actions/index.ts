import {IAction} from '../typedefs'
import {createAction} from './create'
import {listAction} from './list'
import {readAction} from './read'
import {updateAction} from './update'
import {upsertAction} from './upsert'

export const actions: IAction[] = [
  createAction,
  readAction,
  updateAction,
  upsertAction,
  listAction,
]
