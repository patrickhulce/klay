import {assert, IModel, IModelChild} from 'klay-core'
import {get, set} from 'lodash'

const PRIMITIVE_COLUMN_TYPES = new Set(['string', 'number', 'boolean', 'date-time'])

export type ColumnIterator = (model: IModel, path: string[], column: string) => void

export function getFlattenedPath(path: string[]): string {
  return path.join('__')
}

export function forEachColumn(model: IModel, onEach: ColumnIterator, prefix: string[] = []): void {
  const children = model.spec.children as IModelChild[]
  assert.ok(
    model.spec.type === 'object' && model.spec.strict,
    'can only create datatypes for strict objects',
  )
  assert.ok(children && children.length, 'can only create datatypes for objects with children')

  for (const child of children) {
    const spec = child.model.spec
    const fullPath = prefix.concat(child.path)
    if (spec.type === 'object' && spec.strict) {
      forEachColumn(child.model, onEach, fullPath)
    } else {
      onEach(child.model, fullPath, getFlattenedPath(fullPath))
    }
  }
}

export function JSONToSQL(model: IModel, incoming: object): object {
  const record: any = {}

  forEachColumn(model, (childModel, path, column) => {
    const value = get(incoming, path)
    const storedValue = PRIMITIVE_COLUMN_TYPES.has(childModel.spec.type!)
      ? value
      : JSON.stringify(value)
    set(record, column, storedValue)
  })

  return record
}

export function SQLToJSON(model: IModel, record: object, fields?: string[]): any {
  const outgoing: any = {}

  forEachColumn(model, (childModel, path, column) => {
    const storedValue = get(record, column)
    const value = PRIMITIVE_COLUMN_TYPES.has(childModel.spec.type!)
      ? storedValue
      : JSON.parse(storedValue)
    set(outgoing, path, value)
  })

  return outgoing
}
