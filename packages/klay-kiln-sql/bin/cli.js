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
    modelName: {alias: 'm'},
    kilnFile: {alias: 'k', required: true, describe: 'path to file exporting kiln instance'},
  })
  .demandCommand(1)
  .argv

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

async function migrationBootstrap() {
  const kilnFileExports = require(path.resolve(process.cwd(), options.kilnFile))
  const kiln = kilnFileExports.kiln || kilnFileExports
  if (typeof kiln.getModels !== 'function') {
    throw new TypeError('Did not export a kiln')
  }

  const fileContent = createNewMigrationFile(kiln)
  const datePart = new Date().toLocaleString().replace(/[^0-9]+/g, '').slice(0, 12)
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
