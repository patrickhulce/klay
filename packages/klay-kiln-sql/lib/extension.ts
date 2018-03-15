import {IKiln, IKilnExtension, IKilnModel} from 'klay-kiln'

import * as Sequelize from 'sequelize'

import {DatabaseExecutor} from 'klay-db'
import {getConnection, getModel} from './sequelize'
import {SQLExectuor} from './sql-executor'
import {IExecutorOptions, ISQLExecutor, ISQLOptions, ISyncOptions, SQL_EXECUTOR} from './typedefs'

export class SQLExtension implements IKilnExtension<ISQLExecutor, IExecutorOptions> {
  public name: string
  public defaultOptions: IExecutorOptions
  public readonly sequelize: Sequelize.Sequelize

  public constructor(options: ISQLOptions) {
    this.name = SQL_EXECUTOR
    this.defaultOptions = options
    this.sequelize = getConnection(options)
  }

  public async sync(options: ISyncOptions): Promise<void> {
    return this.sequelize.sync(options)
  }

  public build(kilnModel: IKilnModel, options: IExecutorOptions, kiln: IKiln): ISQLExecutor {
    const baseExectuor = new SQLExectuor(
      this.sequelize,
      getModel(this.sequelize, kilnModel, kiln),
      kilnModel,
    )

    return Object.assign(new DatabaseExecutor(kilnModel.model, baseExectuor), baseExectuor)
  }
}
