import {ICoerceFunction, IModel, IValidationResult, ValidationPhase} from 'klay-core'

declare module 'klay-core/dist/typedefs' {
  export interface IModelContext {
    integerId(): IModel
    uuidId(): IModel
    createdAt(): IModel
    updatedAt(): IModel
    password(options: IPasswordOptions): IModel
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

declare module 'klay-core/dist/errors/assertions' {
  export interface IExtraErrorProperties {
    type?: ConstraintType
  }
}

;(ValidationPhase as any).Database = 'database'

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
  referencedModel?: string
  evaluate?(payload: ICustomConstraintPayload): Promise<void>
}

export interface IIndexProperty {
  property: PropertyPath
  direction: SortDirection
}

export type IIndexPropertyInput = PropertyPath | IIndexProperty

export enum DatabaseEvent {
  All = '*',
  Create = 'create',
  Update = 'update',
}

export type SaltFunction = (validationResult: IValidationResult) => string

export interface IPasswordOptions {
  model?: IModel
  algorithm?: 'sha1' | 'sha224'
  salt: string | SaltFunction
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
  record: object
  existing?: object
  model: IModel
  executor: IDatabaseExecutor
  event: DatabaseEvent
  constraint: IConstraint
  extras?: IQueryExtras
}

export enum SortDirection {
  Ascending = 'asc',
  Descending = 'desc',
}

export type PrimaryKey = string | number

export type WhereValue = string | number | boolean | Date

export interface IWhereCondition {
  $eq?: WhereValue
  $ne?: WhereValue
  $match?: string
  $gt?: WhereValue
  $lt?: WhereValue
  $gte?: WhereValue
  $lte?: WhereValue
  $in?: WhereValue[]
  $nin?: WhereValue[]
}

export interface IQueryWhere {
  [value: string]: WhereValue | IWhereCondition
}

export interface IQueryOrderItem {
  property: string[]
  direction: SortDirection
}

export type IQueryOrder = IQueryOrderItem[]

export type IQueryFields = string[][]

export enum IDatabaseExecution {
  Count = 'count',
  Find = 'find',

  Create = 'create',
  Update = 'update',
  Upsert = 'upsert',
  Patch = 'patch',
  Destroy = 'destroy',
}

export interface IDatabaseExecutorMinimal<TRecord extends object = object> {
  transaction<T>(func: (t: IQueryTransaction) => Promise<T>): Promise<T>

  count(query: IQuery, extras?: IQueryExtras): Promise<number>
  findById(id: PrimaryKey, extras?: IQueryExtras): Promise<TRecord | null>
  find(query: IQuery, extras?: IQueryExtras): Promise<TRecord[]>
  save(object: TRecord, extras?: IQueryExtras): Promise<TRecord>
  destroyById(id: PrimaryKey, extras?: IQueryExtras): Promise<void>
}

export interface IDatabaseExecutor<TRecord extends object = object> {
  transaction<T>(func: (t: IQueryTransaction) => Promise<T>): Promise<T>

  count(query: IQuery, extras?: IQueryExtras): Promise<number>
  findById(id: PrimaryKey, extras?: IQueryExtras): Promise<TRecord | null>
  findByIdOrThrow(id: PrimaryKey, extras?: IQueryExtras): Promise<TRecord>
  find(query: IQuery, extras?: IQueryExtras): Promise<TRecord[]>
  destroyById(id: PrimaryKey, extras?: IQueryExtras): Promise<void>

  findOne(query: IQuery, extras?: IQueryExtras): Promise<TRecord | undefined>
  create(record: TRecord, extras?: IQueryExtras): Promise<TRecord>
  createAll(records: TRecord[], extras?: IQueryExtras): Promise<TRecord[]>
  update(record: TRecord, extras?: IQueryExtras): Promise<TRecord>
  updateAll(records: TRecord[], extras?: IQueryExtras): Promise<TRecord[]>
  upsert(record: TRecord, extras?: IQueryExtras): Promise<TRecord>
  upsertAll(records: TRecord[], extras?: IQueryExtras): Promise<TRecord[]>
  patch(id: PrimaryKey, patches: Partial<TRecord>, extras?: IQueryExtras): Promise<TRecord>
  patch(patches: Partial<TRecord>, extras?: IQueryExtras): Promise<TRecord>
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
