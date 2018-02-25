import {assert, IModel, IModelChild, ModelType} from 'klay'
import {ConstraintType, getPrimaryKeyField, SupplyWithPreset} from 'klay-db'
import {IKiln, IKilnModel} from 'klay-kiln'
import {get, set} from 'lodash'
import * as Sequelize from 'sequelize'
import {EXTENSION_NAME, ISQLExecutor, ISQLOptions} from './typedefs'

const PRIMITIVE_COLUMN_TYPES = new Set(['string', 'number', 'boolean', 'date'])

type ColumnIterator = (model: IModel, path: string[], column: string) => void

export function getFlattenedPath(path: string[]): string {
  return path.join('__')
}

function forEachColumn(model: IModel, onEach: ColumnIterator, prefix: string[] = []): void {
  const children = model.spec.children as IModelChild[]
  assert.ok(
    model.spec.type === 'object' && model.spec.strict && children,
    'can only create datatypes for strict objects',
  )

  for (const child of children) {
    const spec = child.model.spec
    const fullPath = prefix.concat(child.path)
    if (spec.type === 'object' && spec.strict) {
      forEachColumn(child.model, onEach, fullPath)
    } else {
      onEach(child.model, fullPath, getFlattenedPath(fullPath))
    }
  }
}

export function getConnection(options: ISQLOptions): Sequelize.Sequelize {
  return new Sequelize(options.database!, options.user!, options.password!, {
    port: options.port,
    host: options.host,
    dialect: options.dialect,
    define: {
      underscored: false,
      timestamps: false,
      freezeTableName: true,
    },
  })
}

export function getSequelizeType(model: IModel): Sequelize.DataTypeAbstract {
  const type = model.spec.type
  const format = model.spec.format

  // tslint:disable-next-line
  switch (format) {
    case 'uuid':
      return Sequelize.UUID
    case 'integer':
      return Sequelize.BIGINT
  }

  switch (type) {
    case ModelType.String:
      const maxLength = model.spec.max
      return maxLength ? Sequelize.STRING(maxLength) : Sequelize.TEXT
    case ModelType.Number:
      return Sequelize.DOUBLE
    case ModelType.Boolean:
      return Sequelize.BOOLEAN
    case ModelType.Date:
      return Sequelize.DATE(6)
    default:
      // record will be JSONified
      return Sequelize.JSON
  }
}

export function getIndexes(model: IModel): Sequelize.DefineIndexesOptions[] {
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
      fields: index.map(
        item =>
          ({
            attribute: getFlattenedPath(item.property),
            order: item.direction as string,
          } as any),
      ),
    })
  }

  return indexes
}

export function JSONToSQL(model: IModel, incoming: object): object {
  const record: any = {}

  forEachColumn(model, (childModel, path, column) => {
    const value = get(incoming, path)
    const storedValue = PRIMITIVE_COLUMN_TYPES.has(childModel.spec.type!)
      ? value
      : JSON.stringify(value)
    set(record, column, storedValue)
  })

  return record
}

export function SQLToJSON(model: IModel, record: object, fields?: string[]): object {
  const outgoing: any = {}

  forEachColumn(model, (childModel, path, column) => {
    const storedValue = get(record, column)
    const value = PRIMITIVE_COLUMN_TYPES.has(childModel.spec.type!)
      ? storedValue
      : JSON.parse(storedValue)
    set(outgoing, path, value)
  })

  return outgoing
}

function addSequelizeDatatypes(modelInProgress: Sequelize.DefineAttributes, model: IModel): void {
  forEachColumn(model, (childModel, path, column) => {
    modelInProgress[column] = getSequelizeType(childModel)
  })
}

function addPrimaryKey(modelInProgress: Sequelize.DefineAttributes, model: IModel): void {
  const pkName = getPrimaryKeyField(model)
  const pkDefinition = modelInProgress[pkName] as Sequelize.DefineAttributeColumnOptions
  pkDefinition.primaryKey = true
  pkDefinition.allowNull = false
}

function addAutomanaged(modelInProgress: Sequelize.DefineAttributes, model: IModel): void {
  const automanaged = model.spec.db!.automanage
  for (const automanage of automanaged) {
    if (automanage.supplyWith !== SupplyWithPreset.AutoIncrement) {
      continue
    }
    const definition = modelInProgress[
      getFlattenedPath(automanage.property)
    ] as Sequelize.DefineAttributeColumnOptions
    definition.autoIncrement = true
  }
}

function addForeignKeys(
  modelInProgress: Sequelize.DefineAttributes,
  model: IModel,
  kiln: IKiln,
): void {
  const constraints = model.spec.db!.constrain
  for (const constraint of constraints) {
    if (constraint.type !== ConstraintType.Reference) {
      continue
    }

    assert.ok(constraint.properties.length === 1, 'foreign key must be single field')
    const fkName = getFlattenedPath(constraint.properties[0])
    const fkDefinition = modelInProgress[fkName] as Sequelize.DefineAttributeColumnOptions
    const sqlExecutor = kiln.build<ISQLExecutor>(constraint.meta.lookupTable!, EXTENSION_NAME)
    fkDefinition.references = {
      key: getPrimaryKeyField(sqlExecutor.kilnModel.model),
      model: sqlExecutor.sequelizeModel,
    }
  }
}

export function getModel(
  sequelize: Sequelize.Sequelize,
  kilnModel: IKilnModel,
  kiln: IKiln,
): Sequelize.Model<any, any> {
  const sequelizeDatatypes: Sequelize.DefineAttributes = {}
  addSequelizeDatatypes(sequelizeDatatypes, kilnModel.model)
  addPrimaryKey(sequelizeDatatypes, kilnModel.model)
  addAutomanaged(sequelizeDatatypes, kilnModel.model)
  addForeignKeys(sequelizeDatatypes, kilnModel.model, kiln)

  const sequelizeModel = sequelize.define(kilnModel.name, sequelizeDatatypes, {
    indexes: getIndexes(kilnModel.model),
    tableName: (kilnModel.metadata as any).plural,
  })

  return sequelizeModel
}
