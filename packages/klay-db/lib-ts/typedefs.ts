import {ICoerceFunction, ValidationPhase} from 'klay'

declare module 'klay/lib/typedefs' {
  export interface IModelContext {
    integerID(): IModel
    uuidID(): IModel
    createdAt(): IModel
    updatedAt(): IModel
  }

  export interface IModel {
    toDatabaseEventModel(event: DatabaseEvent): IModel

    db(spec?: IDatabaseSpecification, options?: IDatabaseSetterOptions): IModel
    automanage(property: IAutomanageProperty): IModel
    constraint(constraint: IConstraint): IModel
    index(properties: IIndexPropertyInput[]): IModel
    primaryKey(meta?: IConstraintMeta): IModel
    unique(meta?: IConstraintMeta): IModel
    immutable(meta?: IConstraintMeta): IModel
    autoIncrement(): IModel
  }

  export interface IModelSpecification {
    db?: IDatabaseSpecification
  }

  export enum ValidationPhase {
    Database = 'database',
  }
}

(ValidationPhase as any).Database = 'database'

export interface IDatabaseSetterOptions {
  shouldMerge: boolean
}

export interface IDatabaseOptions {
  spec: IDatabaseSpecification

  automanage(property: IAutomanagePropertyInput): IDatabaseOptions
  constraint(property: IConstraintInput): IDatabaseOptions
  index(property: IIndexPropertyInput[]): IDatabaseOptions
  reset(): IDatabaseOptions
}

export interface IDatabaseSpecificationUnsafe {
  automanage?: IAutomanageProperty[]
  constraint?: IConstraint[]
  index?: IIndexProperty[][]
}

export interface IDatabaseSpecification {
  automanage: IAutomanageProperty[]
  constraint: IConstraint[]
  index: IIndexProperty[][]
}

export interface IAutomanagePropertyInput {
  property?: PropertyPath
  phase?: ValidationPhase
  event: DatabaseEvent
  supplyWith: ISupplyWithFunction | SupplyWithPreset
}

export interface IAutomanageProperty {
  property: PropertyPath
  event: DatabaseEvent
  phase: ValidationPhase
  supplyWith: ISupplyWithFunction | SupplyWithPreset
}

export interface IConstraintInput {
  properties?: PropertyPath[]
  type: ConstraintType
  meta: IConstraintMeta
}

export interface IConstraint {
  name: string
  properties: PropertyPath[]
  type: ConstraintType
  meta: IConstraintMeta
}

export interface IConstraintMeta {
  name?: string
  behavior?: ConstraintBehavior
  lookupTable?: string
}

export interface IIndexProperty {
  property: PropertyPath
  direction: IndexDirection
}

export type IIndexPropertyInput = PropertyPath | IIndexProperty

export enum DatabaseEvent {
  All = '*',
  Create = 'create',
  Update = 'update',
}

export type PropertyPath = string[]

export type ISupplyWithFunction = ICoerceFunction

export enum SupplyWithPreset {
  AutoIncrement = 'auto-increment',
  Date = 'date',
  ISOTimestamp = 'iso-timestamp',
  UUID = 'uuid',
}

export enum ConstraintType {
  Primary = 'primary',
  Unique = 'unique',
  Reference = 'reference',
  Immutable = 'immutable',
  Custom = 'custom',
}

export enum ConstraintBehavior {
  Reject = 'reject',
  Update = 'update',
}

export enum IndexDirection {
  Ascending = 'asc',
  Descending = 'desc',
}
