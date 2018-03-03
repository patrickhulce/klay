import {assert, IModel} from 'klay'
import {
  evaluateCustomConstraints,
  evaluateImmutableConstraints,
  evaluateUniqueConstraints,
  fetchByUniqueConstraints,
  getPrimaryKey,
  getPrimaryKeyField,
} from './constraints'
import {getModelForEvent} from './helpers'
import {
  DatabaseEvent,
  IDatabaseExecutor,
  IDatabaseExecutorMinimal,
  IQuery,
  IQueryExtras,
  IQueryTransaction,
  PrimaryKey,
} from './typedefs'

export type OnEachFunction = (object: object, extras?: IQueryExtras) => Promise<object>

export class DatabaseExecutor implements IDatabaseExecutor {
  protected _createModel: IModel
  protected _updateModel: IModel
  protected _model: IModel
  protected _executor: IDatabaseExecutorMinimal

  public constructor(model: IModel, executor: IDatabaseExecutorMinimal) {
    this._model = model
    this._createModel = getModelForEvent(model, DatabaseEvent.Create)
    this._updateModel = getModelForEvent(model, DatabaseEvent.Update)
    this._executor = executor
  }

  public transaction<T>(func: (t: IQueryTransaction) => Promise<T>): Promise<T> {
    return this._executor.transaction(func)
  }

  public count(query: IQuery, extras?: IQueryExtras): Promise<number> {
    return this._executor.count(query, extras)
  }

  public findById(id: PrimaryKey, extras?: IQueryExtras): Promise<object | null> {
    return this._executor.findById(id, extras)
  }

  public async findByIdOrThrow(id: PrimaryKey, extras?: IQueryExtras): Promise<object> {
    const result = await this._executor.findById(id, extras)
    assert.ok(result, `unable to find record with ID ${id}`)
    return result!
  }

  public find(query: IQuery, extras?: IQueryExtras): Promise<object[]> {
    return this._executor.find(query, extras)
  }

  public async findOne(query: IQuery, extras?: IQueryExtras): Promise<object | undefined> {
    const results = await this._executor.find(query, extras)
    assert.ok(results.length <= 1, 'expected findOne to return single result')

    return results[0]
  }

  public async create(object: object, extras?: IQueryExtras): Promise<object> {
    const record = this._createModel.validate(object, {failLoudly: true}).value as object
    await evaluateUniqueConstraints(this, this._model, record, extras)
    await evaluateCustomConstraints(
      this,
      this._model,
      record,
      undefined,
      DatabaseEvent.Create,
      extras,
    )

    return this._executor.save(record, extras)
  }

  public async update(object: object, extras?: IQueryExtras): Promise<object> {
    const primaryKey = getPrimaryKey(this._model, object)
    const record = this._updateModel.validate(object, {failLoudly: true}).value as object
    const existing = await this.findByIdOrThrow(primaryKey!)
    await evaluateImmutableConstraints(this, this._model, record, existing, extras)
    await evaluateUniqueConstraints(this, this._model, record, extras)
    await evaluateCustomConstraints(
      this,
      this._model,
      record,
      existing,
      DatabaseEvent.Update,
      extras,
    )

    return this._executor.save(record, extras)
  }

  public async upsert(object: object, extras?: IQueryExtras): Promise<object> {
    const primaryKey = getPrimaryKey(this._model, object)
    if (primaryKey) {
      return this.update(object, extras)
    }

    const existing = await fetchByUniqueConstraints(this, this._model, object, extras)
    return existing ? this.update({...existing, ...object}, extras) : this.create(object, extras)
  }

  public async patch(
    idOrPatches: PrimaryKey | object,
    patchesOrExtras?: object | IQueryExtras,
    maybeExtras?: IQueryExtras,
  ): Promise<object> {
    let id = idOrPatches as PrimaryKey
    let patches = patchesOrExtras as object
    let extras = maybeExtras as IQueryExtras
    if (typeof idOrPatches === 'object') {
      id = getPrimaryKey(this._model, idOrPatches)!
      patches = idOrPatches
      extras = patchesOrExtras as IQueryExtras
    }

    const existing = await this.findById(id, extras)
    return this.update({...existing, ...patches}, extras)
  }

  protected async _withAll(
    onEach: OnEachFunction,
    objects: object[],
    extras?: IQueryExtras,
  ): Promise<object[]> {
    if (extras && extras.transaction) {
      return DatabaseExecutor._withAllTransaction(onEach, objects, extras)
    }

    return this._executor.transaction(transaction =>
      DatabaseExecutor._withAllTransaction(onEach, objects, {...extras, transaction}),
    )
  }

  public async createAll(objects: object[], extras?: IQueryExtras): Promise<object[]> {
    return this._withAll(
      (record: object, extras: IQueryExtras) => this.create(record, extras),
      objects,
      extras,
    )
  }

  public async updateAll(objects: object[], extras?: IQueryExtras): Promise<object[]> {
    return this._withAll(
      (record: object, extras: IQueryExtras) => this.update(record, extras),
      objects,
      extras,
    )
  }

  public async upsertAll(objects: object[], extras?: IQueryExtras): Promise<object[]> {
    return this._withAll(
      (record: object, extras: IQueryExtras) => this.upsert(record, extras),
      objects,
      extras,
    )
  }

  public destroyById(id: PrimaryKey, extras?: IQueryExtras): Promise<void> {
    return this._executor.destroyById(id, extras)
  }

  public async destroy(query: IQuery, extras?: IQueryExtras): Promise<void> {
    const cleanQuery = {where: query.where, fields: [[getPrimaryKeyField(this._model)]]}
    const objects = await this.find(cleanQuery, extras)
    const deletions = objects.map(object =>
      this.destroyById(getPrimaryKey(this._model, object)!, extras),
    )
    await Promise.all(deletions)
  }

  public async destroyOne(query: IQuery, extras?: IQueryExtras): Promise<void> {
    const cleanQuery = {where: query.where, fields: [[getPrimaryKeyField(this._model)]]}
    const object = await this.findOne(cleanQuery, extras)
    if (!object) {
      return
    }

    await this.destroyById(getPrimaryKey(this._model, object)!)
  }

  private static async _withAllTransaction(
    onEach: OnEachFunction,
    objects: object[],
    extras: IQueryExtras,
  ): Promise<object[]> {
    return Promise.all(objects.map(object => onEach(object, extras)))
  }
}
