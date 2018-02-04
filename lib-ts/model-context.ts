import {Model} from './model'
import {IModel, IValidatorOptions, IValidatorOptionsUnsafe} from './typedefs'
import {ValidatorOptions} from './validator-options'

import * as core from './extensions/core'
import * as dates from './extensions/dates'
import * as numbers from './extensions/numbers'
import * as strings from './extensions/strings'

export class ModelContext {
  private _options: IValidatorOptions

  public constructor() {
    this._options = ValidatorOptions.merge(core, strings, numbers, dates)
  }

  public use(extension: IValidatorOptionsUnsafe): ModelContext {
    this._options = ValidatorOptions.merge(this._options, extension)
    return this
  }

  public create(): IModel {
    return new Model({}, this._options)
  }
}
