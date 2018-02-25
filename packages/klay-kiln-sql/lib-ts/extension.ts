import {IKiln, IKilnExtension, IKilnModel} from 'klay-kiln'

import * as Sequelize from 'sequelize'

import {getConnection, getModel} from './sequelize'
import {SQLExectuor} from './sql-executor'
import {EXTENSION_NAME, ISQLExecutor, ISQLOptions} from './typedefs'

export class SQLExtension implements IKilnExtension<ISQLExecutor> {
  public name: string
  public defaultOptions: object
  private readonly _sequelize: Sequelize.Sequelize

  public constructor(options: ISQLOptions) {
    this.name = EXTENSION_NAME
    this.defaultOptions = {}
    this._sequelize = getConnection(options)
  }

  public build(kilnModel: IKilnModel, options: object, kiln: IKiln): ISQLExecutor {
    return new SQLExectuor(this._sequelize, getModel(this._sequelize, kilnModel, kiln), kilnModel)
  }
}
