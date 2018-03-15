import * as Sequelize from 'sequelize'
import {ISQLOptions} from '../typedefs'

export function getConnection(options: ISQLOptions): Sequelize.Sequelize {
  return new Sequelize(options.database!, options.user!, options.password!, {
    port: options.port,
    host: options.host,
    dialect: options.dialect,
    logging: false,
    operatorsAliases: {
      $eq: Sequelize.Op.eq,
      $ne: Sequelize.Op.ne,
      $match: Sequelize.Op.regexp,
      $gte: Sequelize.Op.gte,
      $gt: Sequelize.Op.gt,
      $lte: Sequelize.Op.lte,
      $lt: Sequelize.Op.lt,
      $in: Sequelize.Op.in,
      $nin: Sequelize.Op.notIn,
    },
    define: {
      underscored: false,
      timestamps: false,
      freezeTableName: true,
    },
  })
}
