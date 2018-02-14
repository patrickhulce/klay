import {
  IValidationResult,
  modelAssertions as assertions,
  ValidationPhase,
} from 'klay'
import {cloneDeep, isEqual, uniqWith, values} from 'lodash'
import {v4 as uuid} from 'uuid'
import {
  ConstraintType,
  DatabaseEvent,
  IAutomanageProperty,
  IAutomanagePropertyInput,
  IConstraint,
  IConstraintInput,
  IDatabaseOptions,
  IDatabaseSpecification,
  IDatabaseSpecificationUnsafe,
  IIndexProperty,
  IIndexPropertyInput,
  IndexDirection,
  ISupplyWithFunction,
  SupplyWithPreset,
} from './typedefs'

const supplyWithPresets = {
  [SupplyWithPreset.Date]: (vr: IValidationResult) => vr.setValue(new Date()),
  [SupplyWithPreset.ISOTimestamp]: (vr: IValidationResult) => vr.setValue(new Date().toISOString()),
  [SupplyWithPreset.UUID]: (vr: IValidationResult) => vr.setValue(uuid()),
}

function concat<T>(arrA?: T[], arrB?: T[]): T[] {
  return uniqWith((arrA || []).concat(arrB || []), isEqual)
}

export class DatabaseOptions implements IDatabaseOptions {
  public spec: IDatabaseSpecification

  public constructor(spec?: IDatabaseSpecificationUnsafe) {
    this.spec = cloneDeep(Object.assign(DatabaseOptions.empty(), spec))
  }

  public automanage(property: IAutomanagePropertyInput): IDatabaseOptions {
    assertions.typeof(property, 'object', 'automanage')
    property.property = property.property || []
    property.phase = property.phase || ValidationPhase.Parse
    property.supplyWith = DatabaseOptions._determineSupplyWith(property.supplyWith)

    assertions.typeof(property.property, 'array', 'automanage.propertyPath')
    assertions.oneOf(property.event, values(DatabaseEvent), 'automanage.event')
    assertions.oneOf(property.phase, values(ValidationPhase), 'automanage.phase')

    this.spec.automanage.push(property as IAutomanageProperty)
    return this
  }

  public constrain(input: IConstraintInput): IDatabaseOptions {
    assertions.typeof(input, 'object', 'constrain')
    input.properties = input.properties || [[]]
    input.meta = input.meta || {}

    assertions.typeof(input.properties, 'array', 'constrain.propertyPaths')
    assertions.ok(input.properties.length, 'must specify at least 1 property for constrain')
    assertions.oneOf(input.type, values(ConstraintType), 'constrain.type')
    assertions.typeof(input.meta, 'object')

    const constrain = input as IConstraint
    constrain.name = DatabaseOptions.computeConstraintName(constrain)
    this.spec.constrain.push(constrain)
    return this
  }

  public index(properties: IIndexPropertyInput[]): IDatabaseOptions {
    assertions.typeof(properties, 'array', 'index')
    assertions.ok(properties.length, 'must specify at least 1 property for index')
    properties.forEach((item, i) => {
      properties[i] = DatabaseOptions._determineIndex(item, i)
    })

    this.spec.index.push(properties as IIndexProperty[])
    return this
  }

  public reset(): IDatabaseOptions {
    this.spec = DatabaseOptions.empty()
    return this
  }

  public static computeConstraintName(constraint: IConstraint): string {
    const propertiesAsString = constraint.properties.map(prop => prop.join('.')).join(',')
    return constraint.meta.name || `${constraint.type}:${propertiesAsString}`
  }

  private static _determineSupplyWith(
    supplyWith: ISupplyWithFunction | SupplyWithPreset,
  ): ISupplyWithFunction | SupplyWithPreset {
    if (supplyWith === SupplyWithPreset.AutoIncrement || typeof supplyWith === 'function') {
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

  public static empty(): IDatabaseSpecification {
    return {automanage: [], constrain: [], index: []}
  }

  public static merge(
    specA: IDatabaseSpecificationUnsafe,
    specB: IDatabaseSpecificationUnsafe,
    ...others: IDatabaseSpecificationUnsafe[],
  ): IDatabaseSpecification {
    let specToMerge = specB
    if (others.length) {
      for (const option of others) {
        specToMerge = DatabaseOptions.merge(specToMerge, option)
      }
    }

    const automanage = concat(specA.automanage, specToMerge.automanage)
    const constrain = concat(specA.constrain, specToMerge.constrain)
    const index = concat(specA.index, specToMerge.index)
    return {automanage, constrain, index}
  }
}