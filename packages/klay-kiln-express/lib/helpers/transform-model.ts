import {IModel} from 'klay'
import {ConstraintType, DatabaseEvent, eventMatches, findModel} from 'klay-db'
import {flatten} from 'lodash'

function omitAll(rootModel: IModel, paths: string[][]): IModel {
  for (const path of paths) {
    const parentPath = path.slice(0, path.length - 1)
    const parentModel = findModel(rootModel, parentPath)
    const childName = path[path.length - 1]
    parentModel.omit([childName])
  }

  return rootModel
}

export function creatifyModel(original: IModel): IModel {
  const model = original.clone()
  const automanage = model.spec.db!.automanage
  const automanagedPaths = automanage
    .filter(item => eventMatches(item.event, DatabaseEvent.Create))
    .map(item => item.property)
  return omitAll(model, automanagedPaths)
}

export function updateifyModel(original: IModel): IModel {
  const model = original.clone()
  const constraints = model.spec.db!.constrain
  const automanage = model.spec.db!.automanage
  const automanagedPaths = automanage
    .filter(item => eventMatches(item.event, DatabaseEvent.Update))
    .map(item => item.property)
  const immutableProperties = constraints
    .filter(item => item.type === ConstraintType.Immutable)
    .map(item => item.properties)
  return omitAll(model, [...automanagedPaths, ...flatten(immutableProperties)])
}
