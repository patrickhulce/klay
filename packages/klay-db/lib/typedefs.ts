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
    automanage(property: IAutomanagePropertyInput): IModel
    constrain(constraint: IConstraintInput): IModel
    index(properties: IIndexPropertyInput[]): IModel
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
  constrain(property: IConstraintInput): IDatabaseOptions
  index(property: IIndexPropertyInput[]): IDatabaseOptions
  reset(): IDatabaseOptions
}

export interface IDatabaseSpecificationUnsafe {
  automanage?: IAutomanageProperty[]
  constrain?: IConstraint[]
  index?: IIndexProperty[][]
}

export interface IDatabaseSpecification {
  automanage: IAutomanageProperty[]
  constrain: IConstraint[]
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
  meta?: IConstraintMeta
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

export type PrimaryKey = string | number

export type WhereValue = string | number | boolean | Date

export interface IWhereCondition {
  $eq?: WhereValue
  $neq?: WhereValue
  $gt?: WhereValue
  $lt?: WhereValue
  $in?: WhereValue
  $nin?: WhereValue
}

export interface IQueryWhere {
  [value: string]: WhereValue | IWhereCondition
}

export type IQueryOrder = string[][]

export type IQueryFields = string[]

export interface IDatabaseModel {
  transaction(): Promise<IQueryTransaction>

  count(query: IQuery, extras?: IQueryExtras): Promise<object[]>
  findById(id: PrimaryKey, extras?: IQueryExtras): Promise<object>
  find(query: IQuery, extras?: IQueryExtras): Promise<object[]>
  findOne(query: IQuery, extras?: IQueryExtras): Promise<object | undefined>

  create(object: object, extras?: IQueryExtras): Promise<object>
  create(objects: object[], extras?: IQueryExtras): Promise<object[]>
  update(object: object, extras?: IQueryExtras): Promise<object>
  update(objects: object[], extras?: IQueryExtras): Promise<object[]>
  upsert(object: object, extras?: IQueryExtras): Promise<object>
  upsert(objects: object[], extras?: IQueryExtras): Promise<object[]>
  patch(object: object, extras?: IQueryExtras): Promise<object>
  patch(objects: object[], extras?: IQueryExtras): Promise<object[]>

  destroyById(id: PrimaryKey, extras?: IQueryExtras): Promise<void>
  destroy(query: IQuery, extras?: IQueryExtras): Promise<void>
  destroyOne(query: IQuery, extras?: IQueryExtras): Promise<void>
}

export interface IQueryBuilder {
  where(key: string, value: WhereValue | IWhereCondition): IQueryBuilder
  where(where: IQueryWhere): IQueryBuilder
  limit(value: number): IQueryBuilder
  offset(value: number): IQueryBuilder
  orderBy(value: IQueryOrder): IQueryBuilder
  fields(value: IQueryFields): IQueryBuilder
  clone(): IQueryBuilder
}

export interface IQuery {
  where?: IQueryWhere
  order?: IQueryOrder
  fields?: IQueryFields
  limit?: number
  offset?: number
}

export interface IQueryExtras {
  transaction?: IQueryTransaction
}

// tslint:disable-next-line
export interface IQueryTransaction {}
