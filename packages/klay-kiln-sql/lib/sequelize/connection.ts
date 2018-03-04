import * as Sequelize from 'sequelize'
import {ISQLOptions} from '../typedefs'

export function getConnection(options: ISQLOptions): Sequelize.Sequelize {
  return new Sequelize(options.database!, options.user!, options.password!, {
    port: options.port,
    host: options.host,
    dialect: options.dialect,
    logging: false,
    define: {
      underscored: false,
      timestamps: false,
      freezeTableName: true,
    },
  })
}
