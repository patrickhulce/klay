import {camelCase, forEach} from 'lodash'

import * as core from './extensions/core'
import * as dates from './extensions/dates'
import * as numbers from './extensions/numbers'
import * as strings from './extensions/strings'
import {Model} from './model'
import {
  IKlayExtension,
  IModel,
  IModelContext,
  IModelSpecification,
  IValidatorOptions,
} from './typedefs'
import {ValidatorOptions} from './validator-options'

export class ModelContext {
  private _options: IValidatorOptions

  private constructor() {
    this.reset()

    if (arguments.length) {
      throw new Error('ModelContext constructor does not accept arguments')
    }
  }

  public reset(): void {
    // tslint:disable-next-line
    Object.keys(this).forEach(key => delete (this as any)[key])
    this._options = ValidatorOptions.merge(core, strings, numbers, dates)
    this._setAllBuilders()
  }

  private _setAllBuilders(): void {
    forEach(this._options.formats, (formats, type) => {
      this._setBuilder(camelCase(type), type)
      forEach(formats, format => {
        this._setBuilder(camelCase(format), type, format)
      })
    })
  }

  private _setBuilder(name: string, type: string, format?: string): void {
    const modelContext = this as any
    if (typeof modelContext[name] !== 'undefined') {
      return
    }

    // TODO: update once model can handle type/format undefined
    const builder = () => {
      let model = this.create().type(type)
      if (format) {
        model = model.format(format)
      }

      return model
    }

    modelContext[name] = builder
  }

  public use(extension: IKlayExtension): IModelContext {
    const modelContext = (this as any) as IModelContext
    this._options = ValidatorOptions.merge(this._options, extension)
    if (extension.extendContext) {
      extension.extendContext(modelContext)
    }

    this._setAllBuilders()
    return modelContext
  }

  public create(spec?: IModelSpecification): IModel {
    const model = new Model({}, this._options)
    if (spec) model.spec = spec
    return model
  }

  public static create(): IModelContext {
    return (new ModelContext() as any) as IModelContext
  }
}
