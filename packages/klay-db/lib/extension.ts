import {
  IKlayExtension,
  IModel,
  IModelContext,
  IModelHooks,
  IValidatorMethods,
  ValidationPhase,
} from 'klay-core'

import * as helpers from './helpers'
import {DatabaseOptions} from './options'
import {
  createPasswordCoerceFn,
  fillDefaultPasswordOptions,
  getTotalPasswordLength,
} from './password'
import {
  ConstraintType,
  DatabaseEvent,
  IAutomanageProperty,
  IConstraint,
  IDatabaseSetterOptions,
  IDatabaseSpecification,
  IIndexPropertyInput,
  IPasswordOptions,
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
      constrain(model: IModel, constrain: IConstraint): IModel {
        const database = new DatabaseOptions().constrain(constrain)
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
      password(model: IModel, options: IPasswordOptions): IModel {
        const database = new DatabaseOptions().password(options)
        return model.db(database.spec, {shouldMerge: true})
      },
      toDatabaseEventModel(model: IModel, event: DatabaseEvent): IModel {
        return helpers.getModelForEvent(model, event)
      },
    }
  }

  // tslint:disable-next-line
  public extendContext(context: IModelContext): void {
    context.integerId = () =>
      context
        .integer()
        .constrain({type: ConstraintType.Primary})
        .autoIncrement()
    context.uuidId = () =>
      context
        .uuid()
        .constrain({type: ConstraintType.Primary})
        .automanage({
          property: [],
          event: DatabaseEvent.Create,
          phase: ValidationPhase.Parse,
          supplyWith: SupplyWithPreset.UUID,
        })
    context.createdAt = () =>
      context
        .dateTime()
        .required()
        .constrain({type: ConstraintType.Immutable})
        .automanage({
          property: [],
          event: DatabaseEvent.Create,
          phase: ValidationPhase.Parse,
          supplyWith: SupplyWithPreset.Date,
        })
    context.updatedAt = () =>
      context
        .dateTime()
        .required()
        .automanage({
          property: [],
          event: DatabaseEvent.All,
          phase: ValidationPhase.Parse,
          supplyWith: SupplyWithPreset.Date,
        })
    context.password = (partialOptions: Partial<IPasswordOptions> = {}) => {
      const options = fillDefaultPasswordOptions(context, partialOptions)

      return context
        .string()
        .max(getTotalPasswordLength(options))
        .password(options)
        .coerce(createPasswordCoerceFn(options), ValidationPhase.ValidateChildren)
    }
  }
}
