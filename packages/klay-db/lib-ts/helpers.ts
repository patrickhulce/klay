import {IModelChild} from 'klay'
import {cloneDeep, forEach} from 'lodash'
import {DatabaseOptions} from './options'
import {IDatabaseSpecification} from './typedefs'

export function addPropertyNames(
  spec: IDatabaseSpecification,
  name: string,
): IDatabaseSpecification {
  const cloned = cloneDeep(spec)

  forEach(cloned.automanage, property => {
    property.property = [name].concat(property.property)
  })

  forEach(cloned.constraint, constraint => {
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
  const childrenWithDatabase = children.filter(child => child.model.spec.db)
  const childrenSpecs = childrenWithDatabase.map(child =>
    addPropertyNames(child.model.spec.db!, child.path),
  )
  if (!childrenSpecs.length) {
    return root
  }

  const second = childrenSpecs[0]
  const rest = childrenSpecs.slice(1)
  return DatabaseOptions.merge(root, second, ...rest)
}
