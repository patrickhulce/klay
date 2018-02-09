import {camelCase, forEach} from 'lodash'
import {Model} from './model'
import {IModel, IModelContext, IValidatorOptions, IValidatorOptionsUnsafe} from './typedefs'
import {ValidatorOptions} from './validator-options'

import * as core from './extensions/core'
import * as dates from './extensions/dates'
import * as numbers from './extensions/numbers'
import * as strings from './extensions/strings'

export class ModelContext {
  private _options: IValidatorOptions

  private constructor() {
    this.reset()
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

  public use(extension: IValidatorOptionsUnsafe): IModelContext {
    this._options = ValidatorOptions.merge(this._options, extension)
    this._setAllBuilders()
    return this as any as IModelContext
  }

  public create(): IModel {
    return new Model({}, this._options)
  }

  public static create(): IModelContext {
    return new ModelContext() as any as IModelContext
  }
}
