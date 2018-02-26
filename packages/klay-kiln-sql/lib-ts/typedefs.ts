import { IDatabaseExecutor } from 'klay-db'
import { IKilnModel } from 'klay-kiln'
import * as Sequelize from 'sequelize'

export const EXTENSION_NAME = 'sql'

export enum SQLDialect {
  MySQL = 'mysql',
  Postgres = 'postgres',
}

export interface ISQLOptions {
  database?: string
  user?: string
  password?: string
  host?: string
  port?: number
  dialect: SQLDialect
}

export interface ISyncOptions {
  force?: boolean
}

// tslint:disable-next-line
export interface IExecutorOptions {

}

export interface ISQLExecutor extends IDatabaseExecutor {
  sequelize: Sequelize.Sequelize
  sequelizeModel: Sequelize.Model<any, any>
  kilnModel: IKilnModel
}
