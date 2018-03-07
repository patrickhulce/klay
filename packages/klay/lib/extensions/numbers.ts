import {values} from 'lodash'
import {assertions} from '../errors/assertion-error'
import {
  IValidatorFormats,
  IValidatorValidations,
  ModelType,
} from '../typedefs'

export enum NumberFormat {
  Integer = 'integer',
  Finite = 'finite',
}

export const types = [ModelType.Number]

export const formats: IValidatorFormats = {
  [ModelType.Number]: values(NumberFormat),
}

export const validations: IValidatorValidations = {
  [ModelType.Number]: {
    [NumberFormat.Integer]: [
      result =>
        assertions.ok(Number.isInteger(result.value), 'expected value to be an integer'),
    ],
    [NumberFormat.Finite]: [
      result =>
        assertions.ok(Number.isFinite(result.value), 'expected value to be finite'),
    ],
  },
}
