/* tslint:disable await-promise */
import {IQuery, IQueryExtras, IQueryTransaction} from 'klay-db'
import {IKilnModel} from 'klay-kiln'
import * as Sequelize from 'sequelize'
import {getFlattenedPath, JSONToSQL, SQLToJSON} from './sequelize'
import {ISQLExecutor} from './typedefs'

interface ISequelizeQueryExtras {
  transaction?: Sequelize.Transaction
}

export class SQLExectuor implements ISQLExecutor {
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

  public async findById(id: string | number, extras?: IQueryExtras): Promise<object> {
    const sqlExtras = SQLExectuor._extrasToSequlize(extras)
    const instance = await this.sequelizeModel.findById(id, sqlExtras)
    if (!instance) {
      throw new Error(`No such record with ID ${id}`)
    }

    return SQLToJSON(this.kilnModel.model, instance.toJSON())
  }

  public async find(query: IQuery, extras?: IQueryExtras): Promise<object[]> {
    const sqlExtras = SQLExectuor._extrasToSequlize(extras)
    const instances: Array<Sequelize.Instance<object>> = await this.sequelizeModel.findAll({
      ...sqlExtras,
      // TODO: handle where transformations
      where: query.where as Sequelize.WhereOptions<any>,
      attributes: query.fields && query.fields.map(getFlattenedPath),
      order:
        query.order && query.order.map(item => [getFlattenedPath(item.property), item.direction]),
      limit: query.limit,
      offset: query.offset,
    })

    return instances.map(instance => SQLToJSON(this.kilnModel.model, instance.toJSON()))
  }

  public async save(object: object, extras?: IQueryExtras): Promise<object> {
    const sqlExtras = SQLExectuor._extrasToSequlize(extras)
    const instance = this.sequelizeModel.build(JSONToSQL(this.kilnModel.model, object))
    const record = await instance.save(sqlExtras)
    return SQLToJSON(this.kilnModel.model, record)
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
