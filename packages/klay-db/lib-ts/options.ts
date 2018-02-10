// tslint:disable-next-line
import {assertions, ModelError} from 'klay/lib/errors/model-error'
import {values} from 'lodash'
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

export class DatabaseOptions implements IDatabaseOptions {
  public spec: IDatabaseSpecification

  public constructor(spec?: IDatabaseSpecification) {
    this.spec = spec || {}
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

    switch (supplyWith) {
      case SupplyWithPreset.Date:
        return () => new Date()
      case SupplyWithPreset.ISOTimestamp:
        return () => new Date().toISOString()
      case SupplyWithPreset.UUID:
        return uuid
      default:
        throw new ModelError('invalid automanage supplyWith')
    }
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
}
