import {values} from 'lodash'
import {assertions as validationAssertions} from '../errors/validation-error'
import {
  IValidatorFormats,
  IValidatorValidations,
  ModelType,
} from '../typedefs'

export enum NumberFormat {
  Integer = 'integer',
  Finite = 'finite',
}

export const formats: IValidatorFormats = {
  [ModelType.Number]: values(NumberFormat),
}

export const validations: IValidatorValidations = {
  [ModelType.Number]: {
    [NumberFormat.Integer]: [
      result =>
        validationAssertions.ok(Number.isInteger(result.value), 'expected value to be an integer'),
    ],
    [NumberFormat.Finite]: [
      result =>
        validationAssertions.ok(Number.isFinite(result.value), 'expected value to be finite'),
    ],
  },
}
