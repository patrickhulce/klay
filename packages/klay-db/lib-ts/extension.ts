import {IKlayExtension, IModel, IValidatorMethods} from 'klay'
import {PropertyPath} from 'lodash'
import {DatabaseOptions} from './options'
import {
  IDatabaseSpecification,
  IAutomanageProperty,
  IDatabaseSetterOptions,
  IConstraint,
  IIndexPropertyInput,
  IConstraintMeta,
  ConstraintType,
  DatabaseEvent,
  DatabasePhase,
  SupplyWithPreset,
} from './typedefs'


export class DatabaseExtension implements IKlayExtension {
  public methods: IValidatorMethods

  public constructor() {
    this.methods = {
      db(model: IModel, spec?: IDatabaseSpecification, options?: IDatabaseSetterOptions) {
        let finalSpec = spec
        if (spec && options && options.shouldMerge) {
          finalSpec = DatabaseOptions.merge(model.spec.db || {}, spec)
        }

        model.spec.db = finalSpec
        return model
      },
      automanage(model: IModel, property: IAutomanageProperty) {
        const database = new DatabaseOptions().automanage(property)
        return model.db(database.spec, {shouldMerge: true})
      },
      constraint(model: IModel, constraint: IConstraint) {
        const database = new DatabaseOptions().constraint(constraint)
        return model.db(database.spec, {shouldMerge: true})
      },
      index(model: IModel, properties: IIndexPropertyInput[]) {
        const database = new DatabaseOptions().index(properties)
        return model.db(database.spec, {shouldMerge: true})
      },
      primaryKey(model: IModel, meta?: IConstraintMeta) {
        return DatabaseExtension._constrain(model, ConstraintType.Primary, meta)
      },
      unique(model: IModel, meta?: IConstraintMeta) {
        return DatabaseExtension._constrain(model, ConstraintType.Unique, meta)
      },
      immutable(model: IModel, meta?: IConstraintMeta) {
        return DatabaseExtension._constrain(model, ConstraintType.Immutable, meta)
      },
      autoIncrement(model: IModel) {
        const database = new DatabaseOptions().automanage({
          property: [],
          event: DatabaseEvent.Create,
          phase: DatabasePhase.DelegateToDatabase,
          supplyWith: SupplyWithPreset.AutoIncrement,
        })

        return model.db(database.spec, {shouldMerge: true})
      }
    }
  }

  private static _constrain(model: IModel, type: ConstraintType, meta?: IConstraintMeta): IModel {
    const database = new DatabaseOptions().constraint({
      properties: [[]],
      type,
      meta: meta || {},
    })

    return model.db(database.spec, {shouldMerge: true})
  }
}
