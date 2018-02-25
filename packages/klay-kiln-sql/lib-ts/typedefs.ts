import { IDatabaseExecutorMinimal } from 'klay-db'
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
  dialect?: SQLDialect
}

// tslint:disable-next-line
export interface IExecutorOptions {

}

export interface ISQLExecutor extends IDatabaseExecutorMinimal {
  sequelize: Sequelize.Sequelize
  sequelizeModel: Sequelize.Model<any, any>
  kilnModel: IKilnModel
}
