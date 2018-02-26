import {assert, IModel} from 'klay'
import {ConstraintType, getPrimaryKeyField, SupplyWithPreset} from 'klay-db'
import {IKiln} from 'klay-kiln'
import * as Sequelize from 'sequelize'
import {EXTENSION_NAME, ISQLExecutor} from '../typedefs'
import {getFlattenedPath} from './serialization'

export function addPrimaryKey(modelInProgress: Sequelize.DefineAttributes, model: IModel): void {
  const pkName = getPrimaryKeyField(model)
  const pkDefinition = modelInProgress[pkName] as Sequelize.DefineAttributeColumnOptions
  pkDefinition.primaryKey = true
  pkDefinition.allowNull = false
}

export function addAutomanaged(modelInProgress: Sequelize.DefineAttributes, model: IModel): void {
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

export function addForeignKeys(
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
    const sqlExecutor = kiln.build<ISQLExecutor>(constraint.meta.referencedModel!, EXTENSION_NAME)
    fkDefinition.references = {
      key: getPrimaryKeyField(sqlExecutor.kilnModel.model),
      model: sqlExecutor.sequelizeModel,
    }
  }
}
