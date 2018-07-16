#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs')
const path = require('path')
const Umzug = require('umzug')
const yargs = require('yargs')
const colors = require('colors')
const Sequelize = require('sequelize')

const getConnection = require('../dist/sequelize/connection').getConnection
const createNewMigrationFile = require('../dist/gen/migration').createNewMigrationFile

const options = yargs
  .command('migrate', 'run all pending migrations', {url: {required: true}})
  .command('migrate:revert', 'undo last migration', {url: {required: true}})
  .command('migration:bootstrap', 'create a migration file', {
    kilnFile: {alias: 'k', required: true, describe: 'path to file exporting kiln instance'},
  })
  .command('migration:incremental', 'create an incremental migration file', {
    url: {required: true, describe: 'SQL connection URL if we need to diff'},
    kilnFile: {alias: 'k', required: true, describe: 'path to file exporting kiln instance'},
  })
  .demandCommand(1).argv

function getUmzug() {
  const sequelize = getConnection({connectionURL: options.url})
  return new Umzug({
    logging: console.log,
    storage: 'sequelize',
    storageOptions: {sequelize},
    migrations: {params: [sequelize.getQueryInterface(), Sequelize]},
  })
}

async function migrate() {
  console.log('Starting migrations....')
  await getUmzug().up()
  console.log(colors.green('Migration successful'))
}

async function migrateRevert() {
  console.log('Starting reverse migrations....')
  await getUmzug().down()
  console.log(colors.green('Migration revert successful'))
}

async function migrationBootstrap(connectionURL) {
  const kilnFileExports = require(path.resolve(process.cwd(), options.kilnFile))
  const kiln = kilnFileExports.kiln || kilnFileExports
  if (typeof kiln.getModels !== 'function') {
    throw new TypeError('Did not export a kiln')
  }

  const connection = connectionURL && getConnection({connectionURL})
  const fileContent = await createNewMigrationFile(kiln, connection)
  const datePart = new Date()
    .toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
    .replace(/[^\d]+/g, '')

  const fileName = `migrations/${datePart}-migration.js`
  fs.writeFileSync(fileName, fileContent)
  console.log(colors.green('Wrote migration file '), fileName)
}

function run() {
  switch (options._[0]) {
    case 'migrate':
      return migrate()
    case 'migrate:revert':
      return migrateRevert()
    case 'migration:bootstrap':
      return migrationBootstrap()
    case 'migration:incremental':
      return migrationBootstrap(options.url)
    default:
      throw new Error(`Unrecognized command: ${options._[0]}`)
  }
}

run()
  .then(() => {
    console.log('🏁   Klay SQL Run Complete')
    process.exit(0)
  })
  .catch(err => {
    console.error(colors.red('💣   Fatal Error: \n'), err)
    process.exit(1)
  })
