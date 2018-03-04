/* tslint:disable await-promise */
import {
  getPrimaryKey,
  IDatabaseExecutorMinimal,
  IQuery,
  IQueryExtras,
  IQueryOrderItem,
  IQueryTransaction,
} from 'klay-db'
import {IKilnModel} from 'klay-kiln'
import * as Sequelize from 'sequelize'
import {getFlattenedPath, JSONToSQL, SQLToJSON} from './sequelize'

interface ISequelizeQueryExtras {
  transaction?: Sequelize.Transaction
}

const mapField = getFlattenedPath
const mapOrder = (item: IQueryOrderItem) => [
  getFlattenedPath(item.property),
  item.direction.toUpperCase(),
]

export class SQLExectuor implements IDatabaseExecutorMinimal {
  public sequelize: Sequelize.Sequelize
  public sequelizeModel: Sequelize.Model<Sequelize.Instance<object>, object>
  public kilnModel: IKilnModel

  public constructor(
    sequelize: Sequelize.Sequelize,
    sequelizeModel: Sequelize.Model<Sequelize.Instance<object>, object>,
    kilnModel: IKilnModel,
  ) {
    this.sequelize = sequelize
    this.sequelizeModel = sequelizeModel
    this.kilnModel = kilnModel
  }

  public async transaction<T>(func: (t: IQueryTransaction) => Promise<T>): Promise<T> {
    return this.sequelize.transaction(transaction => func(transaction as IQueryTransaction))
  }

  public async count(query: IQuery, extras?: IQueryExtras): Promise<number> {
    const sqlExtras = SQLExectuor._extrasToSequlize(extras)
    return this.sequelizeModel.count({...sqlExtras, where: query.where})
  }

  public async findById(id: string | number, extras?: IQueryExtras): Promise<object | null> {
    const sqlExtras = SQLExectuor._extrasToSequlize(extras)
    const instance = await this.sequelizeModel.findById(id, sqlExtras)
    return instance && SQLToJSON(this.kilnModel.model, instance.toJSON())
  }

  public async find(query: IQuery, extras?: IQueryExtras): Promise<object[]> {
    const sqlExtras = SQLExectuor._extrasToSequlize(extras)
    const instances: Array<Sequelize.Instance<object>> = await this.sequelizeModel.findAll({
      ...sqlExtras,
      // TODO: handle where transformations
      where: query.where as Sequelize.WhereOptions<any>,
      attributes: query.fields && query.fields.map(mapField),
      order: query.order && query.order.map(mapOrder),
      limit: query.limit,
      offset: query.offset,
    })

    return instances.map(instance => SQLToJSON(this.kilnModel.model, instance.toJSON()))
  }

  public async save(object: object, extras?: IQueryExtras): Promise<object> {
    const sqlExtras = SQLExectuor._extrasToSequlize(extras)
    const primaryKey = getPrimaryKey(this.kilnModel.model, object)
    const sqlValues = JSONToSQL(this.kilnModel.model, object)
    let instance = await this.sequelizeModel.findById(primaryKey)
    if (instance) {
      instance!.set(sqlValues)
    } else {
      instance = this.sequelizeModel.build(sqlValues)
    }

    const record = await instance!.save(sqlExtras)
    return SQLToJSON(this.kilnModel.model, record.toJSON())
  }

  public async destroyById(id: string | number, extras?: IQueryExtras): Promise<void> {
    const sqlExtras = SQLExectuor._extrasToSequlize(extras)
    const instance = await this.sequelizeModel.findById(id, sqlExtras)
    if (!instance) {
      throw new Error(`No such record with ID ${id}`)
    }

    return instance.destroy(sqlExtras)
  }

  private static _extrasToSequlize(extras?: IQueryExtras): ISequelizeQueryExtras {
    return {
      transaction: extras && (extras.transaction as Sequelize.Transaction),
    }
  }
}
