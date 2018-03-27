import {IKiln, IKilnModel} from 'klay-kiln'
import * as Sequelize from 'sequelize'
import {SQLExecutor} from '../sql-executor'
import {SQL_EXECUTOR} from '../typedefs'
import {mapValues, pick, size, flatten} from 'lodash'

function normalizeWhitespace(
  chunk: string,
  padWith: number = 0,
  skipFirst: boolean = true
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
function convertAttribute(attribute: any): any {
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

  return {...extras, type}
}

function convertIndexes(tableName: string, sqlIndexes: any): string[] {
  return sqlIndexes.map((sqlIndex: any) => {
    const index = pick(sqlIndex, ['name', 'unique', 'fields'])
    return `queryInterface.addIndex('${tableName}', ${JSON.stringify(index).replace(/"/g, `'`)})`
  })
}

function createTable(executor: SQLExecutor): string[] {
  // see https://github.com/sequelize/sequelize/blob/b505723927305960003dae2a8b64e1f291a5f927/lib/model.js#L795-L808
  const sqlAttributes = (executor.sequelizeModel as any).rawAttributes
  const sqlIndexes = (executor.sequelizeModel as any).options.indexes
  if (!sqlAttributes || !Array.isArray(sqlIndexes)) {
    throw new Error('Sequelize has changed! Unable to create migration')
  }

  const tableName = executor.sequelizeModel.getTableName() as string
  const attributes = mapValues(sqlAttributes, convertAttribute)
  const stringifiedAttributes = JSON.stringify(attributes, null, 2).replace(/"/g, '')
  return [
    `queryInterface.createTable('${tableName}', ${stringifiedAttributes})`,
    ...convertIndexes(tableName, sqlIndexes),
  ]
}

function dropTable(executor: SQLExecutor): string[] {
  const tableName = executor.sequelizeModel.getTableName()
  return [`queryInterface.dropTable('${tableName}')`]
}

function awaitAll(statements: string[], padWidth?: number): string {
  return statements.map(stmt => `await ${normalizeWhitespace(stmt, padWidth)}`).join('\n\n')
}

export function createNewMigrationFile(kiln: IKiln): string {
  const models = kiln
    .buildAll()
    .filter(result => result.extensionName === SQL_EXECUTOR)
    .map(result => result.value) as SQLExecutor[]
  // TODO: topological sort of models to avoid foreign key issues
  const up = flatten(models.map(createTable))
  const down = flatten(models.map(dropTable).reverse())
  const wrapInFn = (stmts: string[]) =>
    `async (queryInterface, Sequelize) => {\n${normalizeWhitespace(
      awaitAll(stmts, 2),
      2,
      false
    )}\n}`

  const migration = `
    module.exports = {
      up: ${normalizeWhitespace(wrapInFn(up), 6)},
      down: ${normalizeWhitespace(wrapInFn(down), 6)},
    }
  `.trim()

  return normalizeWhitespace(migration)
}
