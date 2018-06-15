import {values} from 'lodash'

import {assert} from '../errors/assertion-error'
import {IValidatorFormats, IValidatorValidations, ModelType, NumberFormat} from '../typedefs'

export const types = [ModelType.Number]

export const formats: IValidatorFormats = {
  [ModelType.Number]: values(NumberFormat),
}

export const validations: IValidatorValidations = {
  [ModelType.Number]: {
    [NumberFormat.Integer]: [
      result => assert.ok(Number.isInteger(result.value), 'expected value to be an integer'),
    ],
    [NumberFormat.Finite]: [
      result => assert.ok(Number.isFinite(result.value), 'expected value to be finite'),
    ],
  },
}
