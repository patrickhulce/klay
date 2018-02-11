import {modelAssertions as assertions} from 'klay'
import {cloneDeep, isEqual, uniqWith, values} from 'lodash'
import {v4 as uuid} from 'uuid'
import {
  ConstraintType,
  DatabaseEvent,
  DatabasePhase,
  IAutomanageProperty,
  IConstraint,
  IDatabaseOptions,
  IDatabaseSpecification,
  IIndexProperty,
  IIndexPropertyInput,
  IndexDirection,
  ISupplyWithFunction,
  SupplyWithPreset,
} from './typedefs'

const supplyWithPresets = {
  [SupplyWithPreset.Date]: () => new Date(),
  [SupplyWithPreset.ISOTimestamp]: () => new Date().toISOString(),
  [SupplyWithPreset.UUID]: () => uuid(), // tslint:disable-line
}

function concat<T>(arrA?: T[], arrB?: T[]): T[] | undefined {
  if (!arrA && !arrB) {
    return undefined
  }

  return uniqWith((arrA || []).concat(arrB || []), isEqual)
}

export class DatabaseOptions implements IDatabaseOptions {
  public spec: IDatabaseSpecification

  public constructor(spec?: IDatabaseSpecification) {
    this.spec = cloneDeep(spec || {})
  }

  public automanage(property: IAutomanageProperty): IDatabaseOptions {
    assertions.typeof(property, 'object', 'automanage')
    property.supplyWith = DatabaseOptions._determineSupplyWith(property.supplyWith)
    assertions.typeof(property.property, 'array', 'automanage.propertyPath')
    assertions.oneOf(property.event, values(DatabaseEvent), 'automanage.event')
    assertions.oneOf(property.phase, values(DatabasePhase), 'automanage.phase')

    const automanage = this.spec.automanage || []
    automanage.push(property)
    this.spec.automanage = automanage
    return this
  }

  public constraint(constraint: IConstraint): IDatabaseOptions {
    assertions.typeof(constraint, 'object', 'constraint')
    constraint.meta = constraint.meta || {}
    assertions.typeof(constraint.properties, 'array', 'constraint.propertyPaths')
    assertions.oneOf(constraint.type, values(ConstraintType), 'constraint.type')
    assertions.typeof(constraint.meta, 'object')
    const propertiesAsString = constraint.properties.map(prop => prop.join('.')).join(',')
    constraint.name = constraint.name || `${constraint.type}:${propertiesAsString}`

    const constraints = this.spec.constraint || []
    constraints.push(constraint)
    this.spec.constraint = constraints
    return this
  }

  public index(properties: IIndexPropertyInput[]): IDatabaseOptions {
    assertions.typeof(properties, 'array', 'index')
    properties.forEach((item, i) => {
      properties[i] = DatabaseOptions._determineIndex(item, i)
    })

    const indexes = this.spec.index || []
    indexes.push(properties as IIndexProperty[])
    this.spec.index = indexes
    return this
  }

  public reset(): IDatabaseOptions {
    this.spec = {}
    return this
  }

  private static _determineSupplyWith(
    supplyWith: ISupplyWithFunction | SupplyWithPreset,
  ): ISupplyWithFunction | SupplyWithPreset {
    if (supplyWith === SupplyWithPreset.Autoincrement || typeof supplyWith === 'function') {
      return supplyWith
    }

    const supplyWithFunc = supplyWithPresets[supplyWith]
    assertions.ok(supplyWithFunc, 'invalid automanage supplyWith')
    return supplyWithFunc
  }

  private static _determineIndex(property: IIndexPropertyInput, i: number): IIndexProperty {
    if (Array.isArray(property)) {
      return {property, direction: IndexDirection.Ascending}
    }

    assertions.typeof(property, 'object')
    assertions.typeof(property.property, 'array', `index.${i}.property`)
    assertions.oneOf(property.direction, values(IndexDirection), `index.${i}.property`)
    return property
  }

  public static merge(
    specA: IDatabaseSpecification,
    specB: IDatabaseSpecification,
    ...others: IDatabaseSpecification[],
  ): IDatabaseSpecification {
    let specToMerge = specB
    if (others.length) {
      for (const option of others) {
        specToMerge = DatabaseOptions.merge(specToMerge, option)
      }
    }

    const automanage = concat(specA.automanage, specToMerge.automanage)
    const constraint = concat(specA.constraint, specToMerge.constraint)
    const index = concat(specA.index, specToMerge.index)
    const output: IDatabaseSpecification = {}
    if (automanage) output.automanage = automanage
    if (constraint) output.constraint = constraint
    if (index) output.index = index
    return output
  }
}
