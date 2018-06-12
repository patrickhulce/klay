import {IAction} from '../typedefs'

import {createAction} from './create'
import {destroyAction} from './destroy'
import {listAction} from './list'
import {patchAction} from './patch'
import {readAction} from './read'
import {updateAction} from './update'
import {upsertAction} from './upsert'

export const actions: IAction[] = [
  createAction,
  readAction,
  updateAction,
  upsertAction,
  patchAction,
  destroyAction,
  listAction,
]
