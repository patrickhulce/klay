import {size, values} from 'lodash'
import {assertions} from '../errors/validation-error'
import {
  ALL_FORMATS,
  IModelSpecification,
  IValidationFunction,
  IValidatorCoerce,
  IValidatorValidations,
  ModelType,
  ValidationPhase,
} from '../typedefs'
import {ValidationResult} from '../validation-result'

function validateMinMax(getValue: (value: any) => number): IValidationFunction {
  return (result: ValidationResult, spec: IModelSpecification) => {
    if (typeof spec.min === 'number') {
      assertions.ok(getValue(result.value) >= spec.min, `expected value to be at least ${spec.min}`)
    }

    if (typeof spec.max === 'number') {
      assertions.ok(getValue(result.value) <= spec.max, `expected value to be at most ${spec.max}`)
    }
  }
}

export const types = values(ModelType)

export const coerce: IValidatorCoerce = {
  [ModelType.Boolean]: {
    [ALL_FORMATS]: {
      [ValidationPhase.CoerceType]: (validationResult, spec) => {
        let value = validationResult.value
        if (!spec.strict) {
          if (value === 'true') {
            value = true
          } else if (value === 'false') {
            value = false
          }
        }

        assertions.typeof(value, 'boolean')
        return validationResult.setValue(value)
      },
    },
  },
  [ModelType.Number]: {
    [ALL_FORMATS]: {
      [ValidationPhase.CoerceType]: (validationResult, spec) => {
        let value = validationResult.value
        if (!spec.strict && typeof value === 'string') {
          const cast = Number(value)
          if (value && !Number.isNaN(cast)) {
            value = cast
          }
        }

        assertions.typeof(value, 'number')
        return validationResult.setValue(value)
      },
    },
  },
  [ModelType.String]: {
    [ALL_FORMATS]: {
      [ValidationPhase.CoerceType]: (validationResult, spec) => {
        let value = validationResult.value
        if (!spec.strict && typeof value !== 'object' && typeof value !== 'undefined') {
          value = String(value)
        }

        assertions.typeof(value, 'string')
        return validationResult.setValue(value)
      },
    },
  },
  [ModelType.Object]: {
    [ALL_FORMATS]: {
      [ValidationPhase.CoerceType]: (validationResult, spec) => {
        let value = validationResult.value
        if (!spec.strict && typeof value === 'string') {
          try {
            value = JSON.parse(value)
          } catch (e) {}
        }

        assertions.typeof(value, 'object')
        return validationResult.setValue(value)
      },
    },
  },
  [ModelType.Array]: {
    [ALL_FORMATS]: {
      [ValidationPhase.CoerceType]: (validationResult, spec) => {
        let value = validationResult.value
        if (!spec.strict && typeof value === 'string') {
          try {
            value = JSON.parse(value)
          } catch (e) {}
        }

        assertions.typeof(value, 'array')
        return validationResult.setValue(value)
      },
    },
  },
}

export const validations: IValidatorValidations = {
  [ModelType.Number]: {
    [ALL_FORMATS]: [validateMinMax(value => value as number)],
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
  [ModelType.Date]: {
    [ALL_FORMATS]: [validateMinMax(value => (value as Date).getTime())],
  },
}
