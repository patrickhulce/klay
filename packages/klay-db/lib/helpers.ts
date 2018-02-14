import {assert, ICoerceFunction, IModel, IModelChild, modelAssertions, ValidationPhase} from 'klay'
import {cloneDeep, forEach} from 'lodash'
import {DatabaseOptions} from './options'
import {DatabaseEvent, IDatabaseSpecification} from './typedefs'

export function addPropertyNames(
  spec: IDatabaseSpecification,
  name: string,
): IDatabaseSpecification {
  const cloned = cloneDeep(spec)

  forEach(cloned.automanage, property => {
    property.property = [name].concat(property.property)
  })

  forEach(cloned.constrain, constraint => {
    constraint.properties = constraint.properties.map(property => [name].concat(property))
    constraint.name = DatabaseOptions.computeConstraintName(constraint)
  })

  forEach(cloned.index, properties => {
    forEach(properties, property => {
      property.property = [name].concat(property.property)
    })
  })

  return cloned
}

export function mergeChildrenIntoRoot(
  root: IDatabaseSpecification,
  children: IModelChild[],
): IDatabaseSpecification {
  const specs = children
    .filter(child => child.model.spec.db)
    .map(child => addPropertyNames(child.model.spec.db!, child.path))
  if (!specs.length) {
    return root
  }

  const next = specs[0]
  const rest = specs.slice(1)
  return DatabaseOptions.merge(root, next, ...rest)
}

export function eventMatches(filter: DatabaseEvent, event: DatabaseEvent): boolean {
  return filter === DatabaseEvent.All || event === filter
}

export function findModel(model: IModel, pathToModel: string[]): IModel {
  let target = model

  const parts = pathToModel.slice()
  while (parts.length) {
    modelAssertions.typeof(model.spec.children, 'array', 'children')
    const nextPath = parts.shift()
    const found = (model.spec.children as IModelChild[]).find(child => child.path === nextPath)
    modelAssertions.ok(found, `could not find model child ${nextPath}`)
    target = found!.model
  }

  return target
}

function setDatabaseProperties(rootModel: IModel, event: DatabaseEvent): void {
  forEach(rootModel.spec.db!.automanage, item => {
    if (item.phase !== ValidationPhase.Database) return
    if (!eventMatches(item.event, event)) return
    const model = findModel(rootModel, item.property)
    model.spec = {}
    model.validations(value => assert.typeof(value.value, 'undefined'))
  })
}

function setAutomanagePhaseProperties(rootModel: IModel, event: DatabaseEvent): void {
  forEach(rootModel.spec.db!.automanage, item => {
    if (item.phase === ValidationPhase.Database) return
    if (!eventMatches(item.event, event)) return
    modelAssertions.typeof(item.supplyWith, 'function')
    const model = findModel(rootModel, item.property)
    model.coerce(item.supplyWith as ICoerceFunction, item.phase)
  })
}

export function getModelForEvent(original: IModel, event: DatabaseEvent): IModel {
  const model = original.clone()
  if (!model.spec.db) {
    return model
  }

  setDatabaseProperties(model, event)
  setAutomanagePhaseProperties(model, event)
  return model
}
