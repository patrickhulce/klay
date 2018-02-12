import {IKlayExtension, IModel, IValidatorMethods, ValidationPhase, IModelHooks} from 'klay'
import {DatabaseOptions} from './options'
import * as helpers from './helpers'
import {
  ConstraintType,
  DatabaseEvent,
  IAutomanageProperty,
  IConstraint,
  IConstraintMeta,
  IDatabaseSetterOptions,
  IDatabaseSpecification,
  IIndexPropertyInput,
  SupplyWithPreset,
} from './typedefs'

export class DatabaseExtension implements IKlayExtension {
  public hooks: IModelHooks
  public methods: IValidatorMethods

  public constructor() {
    this.hooks = {
      construction: [],
      'set-children': [
        model => {
          if (Array.isArray(model.spec.children)) {
            model.spec.db = helpers.mergeChildrenIntoRoot(model.spec.db || {}, model.spec.children)
          }
        },
      ],
    }

    this.methods = {
      db(model: IModel, spec?: IDatabaseSpecification, options?: IDatabaseSetterOptions): IModel {
        let finalSpec = spec
        if (spec && options && options.shouldMerge) {
          finalSpec = DatabaseOptions.merge(model.spec.db || {}, spec)
        }

        model.spec.db = finalSpec
        return model
      },
      automanage(model: IModel, property: IAutomanageProperty): IModel {
        const database = new DatabaseOptions().automanage(property)
        return model.db(database.spec, {shouldMerge: true})
      },
      constraint(model: IModel, constraint: IConstraint): IModel {
        const database = new DatabaseOptions().constraint(constraint)
        return model.db(database.spec, {shouldMerge: true})
      },
      index(model: IModel, properties: IIndexPropertyInput[]): IModel {
        const database = new DatabaseOptions().index(properties)
        return model.db(database.spec, {shouldMerge: true})
      },
      primaryKey(model: IModel, meta?: IConstraintMeta): IModel {
        return DatabaseExtension._constrain(model, ConstraintType.Primary, meta)
      },
      unique(model: IModel, meta?: IConstraintMeta): IModel {
        return DatabaseExtension._constrain(model, ConstraintType.Unique, meta)
      },
      immutable(model: IModel, meta?: IConstraintMeta): IModel {
        return DatabaseExtension._constrain(model, ConstraintType.Immutable, meta)
      },
      autoIncrement(model: IModel): IModel {
        const database = new DatabaseOptions().automanage({
          property: [],
          event: DatabaseEvent.Create,
          phase: ValidationPhase.Database,
          supplyWith: SupplyWithPreset.AutoIncrement,
        })

        return model.db(database.spec, {shouldMerge: true})
      },
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
