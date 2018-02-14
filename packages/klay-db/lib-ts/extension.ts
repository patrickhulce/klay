import {
  IKlayExtension,
  IModel,
  IModelContext,
  IModelHooks,
  IValidatorMethods,
  ValidationPhase,
} from 'klay'
import * as helpers from './helpers'
import {DatabaseOptions} from './options'
import {
  ConstraintType,
  DatabaseEvent,
  IAutomanageProperty,
  IConstraint,
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
      'construction': [],
      'set-children': [
        model => {
          if (Array.isArray(model.spec.children)) {
            const spec = model.spec.db || DatabaseOptions.empty()
            model.spec.db = helpers.mergeChildrenIntoRoot(spec, model.spec.children)
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
      autoIncrement(model: IModel): IModel {
        const database = new DatabaseOptions().automanage({
          property: [],
          event: DatabaseEvent.Create,
          phase: ValidationPhase.Database,
          supplyWith: SupplyWithPreset.AutoIncrement,
        })

        return model.db(database.spec, {shouldMerge: true})
      },
      toDatabaseEventModel(model: IModel, event: DatabaseEvent): IModel {
        return helpers.getModelForEvent(model, event)
      },
    }
  }

  // tslint:disable-next-line
  public extendContext(context: IModelContext): void {
    context.integerID = () =>
      context
        .integer()
        .constraint({type: ConstraintType.Primary})
        .autoIncrement()
    context.uuidID = () =>
      context
        .uuid()
        .constraint({type: ConstraintType.Primary})
        .automanage({
          property: [],
          event: DatabaseEvent.Create,
          phase: ValidationPhase.Parse,
          supplyWith: SupplyWithPreset.UUID,
        })
    context.createdAt = () =>
      context
        .date()
        .required()
        .constraint({type: ConstraintType.Immutable})
        .automanage({
          property: [],
          event: DatabaseEvent.Create,
          phase: ValidationPhase.Parse,
          supplyWith: SupplyWithPreset.Date,
        })
    context.updatedAt = () =>
      context
        .date()
        .required()
        .automanage({
          property: [],
          event: DatabaseEvent.All,
          phase: ValidationPhase.Parse,
          supplyWith: SupplyWithPreset.Date,
        })
  }
}
