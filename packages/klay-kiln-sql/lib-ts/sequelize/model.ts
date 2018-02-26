import {IModel, ModelType} from 'klay'
import {ConstraintType} from 'klay-db'
import {IKiln, IKilnModel} from 'klay-kiln'
import * as Sequelize from 'sequelize'
import * as constraints from './constraints'
import {forEachColumn, getFlattenedPath} from './serialization'

function getSequelizeType(model: IModel): Sequelize.DataTypeAbstract {
  const type = model.spec.type
  const format = model.spec.format

  // tslint:disable-next-line
  switch (format) {
    case 'uuid':
      return Sequelize.UUID()
    case 'integer':
      return Sequelize.BIGINT()
  }

  switch (type) {
    case ModelType.String:
      const maxLength = model.spec.max
      return maxLength ? Sequelize.STRING(maxLength) : Sequelize.TEXT()
    case ModelType.Number:
      return Sequelize.DOUBLE()
    case ModelType.Boolean:
      return Sequelize.BOOLEAN
    case ModelType.Date:
      return Sequelize.DATE(6)
    default:
      // record will be JSONified
      return Sequelize.JSON
  }
}

function getIndexes(model: IModel): Sequelize.DefineIndexesOptions[] {
  const db = model.spec.db
  if (!db) {
    return []
  }

  const indexes: Sequelize.DefineIndexesOptions[] = []

  for (const constraint of db.constrain) {
    if (constraint.type !== ConstraintType.Unique) {
      continue
    }

    indexes.push({unique: true, fields: constraint.properties.map(getFlattenedPath)})
  }

  for (const index of db.index) {
    indexes.push({
      method: 'BTREE',
      fields: index.map(item => ({
        attribute: getFlattenedPath(item.property),
        order: item.direction.toUpperCase(),
        collate: undefined as any,
        length: undefined as any,
      })),
    })
  }

  return indexes
}

function addSequelizeDatatypes(modelInProgress: Sequelize.DefineAttributes, model: IModel): void {
  forEachColumn(model, (childModel, path, column) => {
    modelInProgress[column] = {type: getSequelizeType(childModel)}
  })
}

export function getModel(
  sequelize: Sequelize.Sequelize,
  kilnModel: IKilnModel,
  kiln: IKiln,
): Sequelize.Model<Sequelize.Instance<object>, object> {
  const sequelizeDatatypes: Sequelize.DefineAttributes = {}
  addSequelizeDatatypes(sequelizeDatatypes, kilnModel.model)
  constraints.addPrimaryKey(sequelizeDatatypes, kilnModel.model)
  constraints.addAutomanaged(sequelizeDatatypes, kilnModel.model)
  constraints.addForeignKeys(sequelizeDatatypes, kilnModel.model, kiln)

  return sequelize.define(kilnModel.name, sequelizeDatatypes, {
    indexes: getIndexes(kilnModel.model),
    // TODO: move the plural setting up to kiln level
    tableName: (kilnModel.metadata as any).plural || `${kilnModel.name}s`,
  })
}
