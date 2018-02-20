import {assert, IModel} from 'klay'
import {get, isEqual} from 'lodash'
import {QueryBuilder} from './query-builder'
import {
  ConstraintType,
  DatabaseEvent,
  IDatabaseExecutor,
  IQueryExtras,
  PrimaryKey,
} from './typedefs'

export function getPrimaryKeyField(model: IModel): string {
  const pkConstraint = model.spec.db!.constrain.find(
    constraint => constraint.type === ConstraintType.Primary,
  )!

  assert.ok(pkConstraint, 'missing primary key constraint')
  assert.ok(pkConstraint.properties.length === 1, 'multi-column primary key not supported')
  const propertyPath = pkConstraint.properties[0]
  assert.ok(propertyPath.length === 1, 'primary key cannot be nested')
  return propertyPath[0]
}

export function getPrimaryKey(model: IModel, object: object): PrimaryKey | undefined {
  return get(object, getPrimaryKeyField(model))
}

export async function fetchByUniqueConstraints(
  executor: IDatabaseExecutor,
  model: IModel,
  record: object,
  extras?: IQueryExtras,
): Promise<object | undefined> {
  const uniqueConstraints = model.spec.db!.constrain.filter(
    constraint => constraint.type === ConstraintType.Unique,
  )
  const matchingQueries = uniqueConstraints.map(constraint => {
    const queryBuilder = new QueryBuilder()
    constraint.properties.forEach(propertyPath =>
      queryBuilder.where(propertyPath.join('.'), get(record, propertyPath)),
    )

    return executor.findOne(queryBuilder.query, extras)
  })

  const matching = (await Promise.all(matchingQueries)).filter(Boolean)
  if (!matching.length) {
    return undefined
  }

  const first = matching[0]
  matching.forEach(item => assert.ok(isEqual(item, first), 'conflicting unique constraints'))
  return first
}

export async function evaluateUniqueConstraints(
  executor: IDatabaseExecutor,
  model: IModel,
  record: object,
  extras?: IQueryExtras,
): Promise<void> {
  const primaryKey = getPrimaryKey(model, record)
  const existing = await fetchByUniqueConstraints(executor, model, record, extras)
  assert.ok(
    !existing || primaryKey === getPrimaryKey(model, existing),
    'value violates unique constraints',
  )
}

export async function evaluateImmutableConstraints(
  executor: IDatabaseExecutor,
  model: IModel,
  record: object,
  extras?: IQueryExtras,
): Promise<void> {
  const primaryKey = getPrimaryKey(model, record)!
  assert.ok(primaryKey, 'cannot find record without ID')
  const existing = await executor.findById(primaryKey, extras)
  assert.ok(existing, `cannot find record ID ${primaryKey}`)
  const immutableConstraints = model.spec.db!.constrain.filter(
    constraint => constraint.type === ConstraintType.Immutable,
  )

  immutableConstraints.forEach(constraint => {
    constraint.properties.forEach(propertyPath => {
      const previous = get(existing, propertyPath)
      const next = get(record, propertyPath)
      const name = propertyPath.join('.')
      assert.ok(isEqual(previous, next), `${name} violates immutable`)
    })
  })
}

export async function evaluateCustomConstraints(
  executor: IDatabaseExecutor,
  model: IModel,
  record: object,
  event: DatabaseEvent,
  extras?: IQueryExtras,
): Promise<void> {
  const customConstraints = model.spec.db!.constrain.filter(
    constraint => constraint.type === ConstraintType.Custom,
  )
  if (!customConstraints.length) {
    return
  }

  const customQueries = customConstraints.map(constraint => {
    assert.ok(constraint.meta.evaluate, 'custom constraint missing evaluation function')
    return constraint.meta!.evaluate!({record, model, executor, extras, event, constraint})
  })

  await Promise.all(customQueries)
}
