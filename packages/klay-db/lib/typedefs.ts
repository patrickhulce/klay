import {ICoerceFunction, IModel, ValidationPhase} from 'klay'

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
  lookupTable?: string
  evaluate?(payload: ICustomConstraintPayload): Promise<void>
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

export interface ICustomConstraintPayload {
  record: object,
  model: IModel,
  executor: IDatabaseExecutor,
  event: DatabaseEvent,
  constraint: IConstraint,
  extras?: IQueryExtras,
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

export enum IDatabaseExecution {
  Count = 'count',
  Find = 'find',

  Create = 'create',
  Update = 'update',
  Upsert = 'upsert',
  Patch = 'patch',
  Destroy = 'destroy',
}

export interface IDatabaseExecutorMinimal {
  transaction<T>(func: (t: IQueryTransaction) => Promise<T>): Promise<T>

  count(query: IQuery, extras?: IQueryExtras): Promise<number>
  findById(id: PrimaryKey, extras?: IQueryExtras): Promise<object>
  find(query: IQuery, extras?: IQueryExtras): Promise<object[]>
  save(object: object, extras?: IQueryExtras): Promise<object>
  destroyById(id: PrimaryKey, extras?: IQueryExtras): Promise<void>
}

export interface IDatabaseExecutor {
  transaction<T>(func: (t: IQueryTransaction) => Promise<T>): Promise<T>

  count(query: IQuery, extras?: IQueryExtras): Promise<number>
  findById(id: PrimaryKey, extras?: IQueryExtras): Promise<object>
  find(query: IQuery, extras?: IQueryExtras): Promise<object[]>
  destroyById(id: PrimaryKey, extras?: IQueryExtras): Promise<void>

  findOne(query: IQuery, extras?: IQueryExtras): Promise<object | undefined>
  create(record: object, extras?: IQueryExtras): Promise<object>
  createAll(records: object[], extras?: IQueryExtras): Promise<object[]>
  update(record: object, extras?: IQueryExtras): Promise<object>
  updateAll(records: object[], extras?: IQueryExtras): Promise<object[]>
  upsert(record: object, extras?: IQueryExtras): Promise<object>
  upsertAll(records: object[], extras?: IQueryExtras): Promise<object[]>
  patch(id: PrimaryKey, patches: object, extras?: IQueryExtras): Promise<object>
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
