import {IModel, assert} from 'klay-core'
import {get, isEqual, isNil} from 'lodash'

import {constraintAssertions} from './constraint-error'
import {QueryBuilder} from './query-builder'
import {
  ConstraintType,
  DatabaseEvent,
  IConstraint,
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

export async function fetchByUniqueConstraint(
  executor: IDatabaseExecutor,
  constraint: IConstraint,
  record: object,
  extras?: IQueryExtras,
): Promise<object | undefined> {
  const queryBuilder = new QueryBuilder()

  // Unique constraints don't apply to records with `NULL` entry
  if (constraint.properties.length === 1 && isNil(get(record, constraint.properties[0]))) {
    return undefined
  }

  constraint.properties.forEach(propertyPath =>
    queryBuilder.where(propertyPath.join('.'), get(record, propertyPath)),
  )

  return executor.findOne(queryBuilder.query, extras)
}

export type UniqueConstraintFn = (
  match: object | undefined,
  constraint: IConstraint,
) => Promise<void>

export async function forEachMatchingUnique(
  executor: IDatabaseExecutor,
  model: IModel,
  record: object,
  onEach: UniqueConstraintFn,
  extras?: IQueryExtras,
): Promise<void> {
  const uniqueConstraints = model.spec.db!.constrain.filter(
    constraint => constraint.type === ConstraintType.Unique,
  )

  const matchingQueries = uniqueConstraints.map(constraint =>
    fetchByUniqueConstraint(executor, constraint, record, extras).then(match =>
      onEach(match, constraint),
    ),
  )

  await Promise.all(matchingQueries)
}

export async function fetchByUniqueConstraints(
  executor: IDatabaseExecutor,
  model: IModel,
  record: object,
  extras?: IQueryExtras,
): Promise<object | undefined> {
  const matches: object[] = []
  await forEachMatchingUnique(
    executor,
    model,
    record,
    async match => {
      if (match) {
        matches.push(match)
      }
    },
    extras,
  )

  if (!matches.length) {
    return undefined
  }

  const existing = matches[0]
  matches.forEach(item =>
    constraintAssertions.ok(isEqual(item, existing), 'conflicting unique constraints'),
  )
  return existing
}

export async function evaluateUniqueConstraints(
  executor: IDatabaseExecutor,
  model: IModel,
  record: object,
  extras?: IQueryExtras,
): Promise<void> {
  const primaryKey = getPrimaryKey(model, record)
  await forEachMatchingUnique(
    executor,
    model,
    record,
    async (existing, constraint) => {
      constraintAssertions.ok(
        !existing || primaryKey === getPrimaryKey(model, existing),
        `constraint ${constraint.name} violated`,
        {
          type: ConstraintType.Unique,
          path: constraint.properties[0].join('.'),
        },
      )
    },
    extras,
  )
}

export async function evaluateImmutableConstraints(
  executor: IDatabaseExecutor,
  model: IModel,
  record: object,
  existing: object,
  extras?: IQueryExtras,
): Promise<void> {
  const immutableConstraints = model.spec.db!.constrain.filter(
    constraint => constraint.type === ConstraintType.Immutable,
  )

  immutableConstraints.forEach(constraint => {
    constraint.properties.forEach(propertyPath => {
      const previous = get(existing, propertyPath)
      const next = get(record, propertyPath)
      const name = propertyPath.join('.')
      constraintAssertions.ok(isEqual(previous, next), `immutable constraint ${name} violated`, {
        path: propertyPath.join('.'),
        type: ConstraintType.Immutable,
      })
    })
  })
}

export async function evaluateCustomConstraints(
  executor: IDatabaseExecutor,
  model: IModel,
  record: object,
  existing: object | undefined,
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

    return constraint.meta!.evaluate!({
      record,
      existing,
      model,
      executor,
      extras,
      event,
      constraint,
    })
  })

  await Promise.all(customQueries)
}
