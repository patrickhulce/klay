import {IModel, ModelType} from 'klay-core'
import {ConstraintType} from 'klay-db'
import {IKiln, IKilnModel} from 'klay-kiln'
import {snakeCase} from 'lodash'
import * as Sequelize from 'sequelize'
import * as constraints from './constraints'
import {forEachColumn, getFlattenedPath} from './serialization'

export function getSequelizeType(model: IModel): Sequelize.DataTypeAbstract {
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
      return Sequelize.TEXT()
  }
}

function getIndexes(model: IModel, tableName: string): Sequelize.DefineIndexesOptions[] {
  const db = model.spec.db
  if (!db) {
    return []
  }

  const indexes: Sequelize.DefineIndexesOptions[] = []

  for (const constraint of db.constrain) {
    if (constraint.type !== ConstraintType.Unique) {
      continue
    }

    const name = constraint.name.replace(/[^a-z0-9_]+/gi, '_').toLowerCase()
    indexes.push({
      name: `${tableName}_${name}`,
      unique: true,
      fields: constraint.properties.map(getFlattenedPath),
    })
  }

  for (const index of db.index) {
    const fields = index.map(item => ({
      attribute: getFlattenedPath(item.property),
      order: item.direction.toUpperCase(),
      collate: undefined as any,
      length: undefined as any,
    }))

    const name = fields
      .map(field => `${field.attribute}_${field.order}`)
      .join('__')
      .toLowerCase()

    indexes.push({
      name: `${tableName}_${name}`,
      method: 'BTREE',
      fields,
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

  const tableName = kilnModel.meta.tableName || snakeCase(kilnModel.meta.plural!)
  return sequelize.define(kilnModel.name, sequelizeDatatypes, {
    indexes: getIndexes(kilnModel.model, tableName),
    tableName,
  })
}
