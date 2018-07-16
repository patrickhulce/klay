import {IKiln} from 'klay-kiln'
import {entries, pick, size, values} from 'lodash'

import * as sequelize from '../../../../node_modules/@types/sequelize'
import {SQL_EXECUTOR} from '../typedefs'

interface ISequelizeAttribute {
  type: any
  primaryKey: boolean
  allowNull: boolean
  autoIncrement: boolean
  references: {key: string; model: string}
}

interface ISequelizeIndex {
  name: string
  unique: boolean
  fields: string[]
}

interface IMigrationRequest {
  type: MigrationType
  tableName: string
  columnName?: string
  sequelizeData: sequelize.Model<any, any> | ISequelizeIndex | ISequelizeAttribute
}

type SequelizeModel = sequelize.Model<any, any>

enum MigrationType {
  CREATE_TABLE,
  DROP_TABLE,
  ADD_INDEX,
  DROP_INDEX,
  ADD_COLUMN,
  REMOVE_COLUMN,
}

function normalizeWhitespace(
  chunk: string,
  padWith: number = 0,
  skipFirst: boolean = true,
): string {
  const lines = chunk.split('\n').filter(Boolean)
  const minWhitespace = Math.min(...lines.slice(1).map(l => l.length - l.trimLeft().length))
  return lines
    .map((line, index) => {
      if (index === 0 && skipFirst) return line.trimLeft()
      const padding = ' '.repeat(padWith)
      const normalizedLine = line.slice(minWhitespace)
      return `${padding}${normalizedLine}`
    })
    .join('\n')
}

// see https://github.com/sequelize/sequelize/blob/b505723927305960003dae2a8b64e1f291a5f927/lib/data-types.js
function convertAttribute(attribute: ISequelizeAttribute): string {
  let typeExpression = attribute.type.constructor.name
  if (attribute.type._length) {
    typeExpression += `(${attribute.type._length})`
  }

  const type = `Sequelize.${typeExpression}`
  const extras = pick(attribute, ['primaryKey', 'allowNull', 'autoIncrement', 'references'])
  if (!size(extras)) {
    return type
  }

  if (extras.references) {
    extras.references.key = `'${extras.references.key}'`
    extras.references.model = `'${extras.references.model}'`
  }

  return JSON.stringify({...extras, type}, null, 2).replace(/"/g, '')
}

function createStatementForTable(tableName: string, model: SequelizeModel): string {
  const attributeStrings: string[] = []
  for (const [columnName, attribute] of entries((model as any).rawAttributes)) {
    attributeStrings.push(`${columnName}: ${convertAttribute(attribute as ISequelizeAttribute)}`)
  }

  const stringifiedAttributes = `{\n${attributeStrings.join(',\n')}\n}`
  return `queryInterface.createTable('${tableName}', ${stringifiedAttributes})`
}

function createStatementForIndex(tableName: string, index: ISequelizeIndex): string {
  const subset = pick(index, ['name', 'unique', 'fields'])
  return `queryInterface.addIndex('${tableName}', ${JSON.stringify(subset).replace(/"/g, `'`)})`
}

function createStatementForColumn(
  tableName: string,
  columnName: string,
  attribute: ISequelizeAttribute,
): string {
  return `queryInterface.addColumn('${tableName}', '${columnName}', ${convertAttribute(attribute)})`
}

function awaitAll(statements: string[], padWidth?: number): string {
  return statements.map(stmt => `await ${normalizeWhitespace(stmt, padWidth)}`).join('\n\n')
}

function createStatementFor(migration: IMigrationRequest): string {
  const {type, tableName, columnName, sequelizeData} = migration
  const table = sequelizeData as SequelizeModel
  const column = sequelizeData as ISequelizeAttribute
  const index = sequelizeData as ISequelizeIndex

  switch (type) {
    case MigrationType.CREATE_TABLE:
      return createStatementForTable(tableName, table)
    case MigrationType.ADD_INDEX:
      return createStatementForIndex(tableName, index)
    case MigrationType.ADD_COLUMN:
      return createStatementForColumn(tableName, columnName!, column)
    case MigrationType.DROP_TABLE:
      return `queryInterface.dropTable('${tableName}')`
    case MigrationType.DROP_INDEX:
      return `queryInterface.removeIndex('${tableName}', '${index.name}')`
    case MigrationType.REMOVE_COLUMN:
      return `queryInterface.removeColumn('${tableName}', '${columnName}')`
    default:
      throw new Error('Unrecognized type')
  }
}

function computeFreshMigrations(models: SequelizeModel[]): IMigrationRequest[] {
  const migrations: IMigrationRequest[] = []
  for (const model of models) {
    const tableName = model.getTableName() as string
    migrations.push({
      tableName,
      type: MigrationType.CREATE_TABLE,
      sequelizeData: model,
    })

    const indexes = (model as any).options.indexes as ISequelizeIndex[]
    for (const index of indexes) {
      migrations.push({tableName, type: MigrationType.ADD_INDEX, sequelizeData: index})
    }
  }

  return migrations
}

async function computeIncrementalMigrations(
  models: SequelizeModel[],
  connection: sequelize.Sequelize,
): Promise<IMigrationRequest[]> {
  const tablesResult: any[][] = await connection.query('show tables')
  const tablesInDb = new Set(tablesResult[0].map(row => values(row)[0]))
  const migrations: IMigrationRequest[] = []

  for (const model of models) {
    const tableName = model.getTableName() as string
    if (tablesInDb.has(tableName)) {
      const columnsResult: any[][] = await connection.query(`show columns from ${tableName}`)
      const indexesResult: any[][] = await connection.query(`show indexes from ${tableName}`)
      const columnsInDb = new Set(columnsResult[0].map(row => row.Field))
      const indexesInDb = new Set(indexesResult[0].map(row => row.Key_name))

      // see https://github.com/sequelize/sequelize/blob/b505723927305960003dae2a8b64e1f291a5f927/lib/model.js#L795-L808
      const columnsInKiln = (model as any).rawAttributes
      for (const [columnName, column] of entries(columnsInKiln)) {
        if (!columnsInDb.has(columnName)) {
          migrations.push({
            tableName,
            columnName,
            type: MigrationType.ADD_COLUMN,
            sequelizeData: column as ISequelizeAttribute,
          })
        }
      }

      const indexesInKiln = (model as any).options.indexes as ISequelizeIndex[]
      for (const index of indexesInKiln) {
        if (!indexesInDb.has(index.name)) {
          migrations.push({
            tableName,
            type: MigrationType.ADD_INDEX,
            sequelizeData: index,
          })
        }
      }
    } else {
      migrations.push({
        tableName,
        type: MigrationType.CREATE_TABLE,
        sequelizeData: model,
      })
    }
  }

  return migrations
}

async function computeMigrations(
  models: SequelizeModel[],
  connection?: sequelize.Sequelize,
): Promise<IMigrationRequest[]> {
  return connection
    ? computeIncrementalMigrations(models, connection)
    : computeFreshMigrations(models)
}

function computeReverseMigrations(migrations: IMigrationRequest[]): IMigrationRequest[] {
  return migrations.map(migration => {
    switch (migration.type) {
      case MigrationType.CREATE_TABLE:
        return {...migration, type: MigrationType.DROP_TABLE}
      case MigrationType.ADD_COLUMN:
        return {...migration, type: MigrationType.REMOVE_COLUMN}
      case MigrationType.ADD_INDEX:
        return {...migration, type: MigrationType.DROP_INDEX}
      default:
        throw new Error(`No reverse of ${migration.type}`)
    }
  })
}

export async function createNewMigrationFile(
  kiln: IKiln,
  connection?: sequelize.Sequelize,
): Promise<string> {
  const models = kiln
    .buildAll()
    .filter(result => result.extensionName === SQL_EXECUTOR)
    .map(result => result.value.sequelizeModel) as SequelizeModel[]

  for (const model of models) {
    if (!(model as any).rawAttributes || !Array.isArray((model as any).options.indexes)) {
      throw new Error('Sequelize has changed! Unable to create migration')
    }
  }

  const upMigrations = await computeMigrations(models, connection)
  const downMigrations = computeReverseMigrations(upMigrations)

  // TODO: topological sort of models to avoid foreign key issues
  const up = upMigrations.map(createStatementFor)
  const down = downMigrations.map(createStatementFor).reverse()

  const wrapInFn = (stmts: string[]) =>
    `async (queryInterface, Sequelize) => {\n${normalizeWhitespace(
      awaitAll(stmts, 2),
      2,
      false,
    )}\n}`

  const migration = `
    module.exports = {
      up: ${normalizeWhitespace(wrapInFn(up), 6)},
      down: ${normalizeWhitespace(wrapInFn(down), 6)},
    }
  `.trim()

  return normalizeWhitespace(migration)
}
