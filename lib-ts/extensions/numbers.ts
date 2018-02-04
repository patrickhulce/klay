import {size, values} from 'lodash'
import {assertions as modelAssertions} from '../errors/model-error'
import {assertions as validationAssertions} from '../errors/validation-error'
import {
  ALL_FORMATS,
  IModel,
  IModelSpecification,
  IValidationFunction,
  IValidatorFormats,
  IValidatorValidations,
  ModelType,
} from '../typedefs'
import {ValidationResult} from '../validation-result'

declare module '../typedefs' {
  interface IModel {
    min(value: number): IModel
    max(value: number): IModel
    size(value: number): IModel
  }

  interface IModelSpecification {
    min?: number
    max?: number
  }
}

export enum NumberFormat {
  Integer = 'integer',
  Finite = 'finite',
}

export const formats: IValidatorFormats = {
  [ModelType.Number]: values(NumberFormat),
}

function validateMinMax(getValue: (value: any) => number): IValidationFunction {
  return (result: ValidationResult, spec: IModelSpecification) => {
    if (typeof spec.min === 'number') {
      validationAssertions.ok(
        getValue(result.value) >= spec.min,
        `expected value to be at least ${spec.min}`,
      )
    }

    if (typeof spec.max === 'number') {
      validationAssertions.ok(
        getValue(result.value) <= spec.max,
        `expected value to be at most ${spec.max}`,
      )
    }
  }
}

export const validations: IValidatorValidations = {
  [ModelType.Number]: {
    [ALL_FORMATS]: [validateMinMax(value => value as number)],
    [NumberFormat.Integer]: [
      result =>
        validationAssertions.ok(Number.isInteger(result.value), 'expected value to be an integer'),
    ],
    [NumberFormat.Finite]: [
      result =>
        validationAssertions.ok(Number.isFinite(result.value), 'expected value to be finite'),
    ],
  },
  [ModelType.String]: {
    [ALL_FORMATS]: [validateMinMax(value => (value as string).length)],
  },
  [ModelType.Object]: {
    [ALL_FORMATS]: [validateMinMax(value => size(value as object))],
  },
  [ModelType.Array]: {
    [ALL_FORMATS]: [validateMinMax(value => size(value as any[]))],
  },
}

export const methods = {
  min(model: IModel, value: number): IModel {
    modelAssertions.typeof(value, 'number', 'min')
    model.spec.min = value
    return model
  },
  max(model: IModel, value: number): IModel {
    modelAssertions.typeof(value, 'number', 'min')
    model.spec.max = value
    return model
  },
  size(model: IModel, value: number): IModel {
    modelAssertions.ok(model.spec.type !== 'number', 'cannot call size on number model')
    modelAssertions.typeof(value, 'number', 'min')
    model.spec.min = value
    model.spec.max = value
    return model
  },
}
