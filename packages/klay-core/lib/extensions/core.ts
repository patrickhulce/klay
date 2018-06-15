import {difference, size, values} from 'lodash'

import {assert} from '../errors/assertion-error'
import {
  ALL_FORMATS,
  IModelSpecification,
  IValidationFunction,
  IValidationResult,
  IValidatorCoerce,
  IValidatorValidations,
  ModelType,
  ValidationPhase,
} from '../typedefs'

function validateMinMax(getValue: (value: any) => number): IValidationFunction {
  return (result: IValidationResult, spec: IModelSpecification) => {
    if (typeof spec.min === 'number') {
      assert.ok(getValue(result.value) >= spec.min, `expected value to be at least ${spec.min}`)
    }

    if (typeof spec.max === 'number') {
      assert.ok(getValue(result.value) <= spec.max, `expected value to be at most ${spec.max}`)
    }
  }
}

export const types = values(ModelType)

export const coerce: IValidatorCoerce = {
  [ModelType.Undefined]: {
    [ALL_FORMATS]: {
      [ValidationPhase.CoerceType]: validationResult => {
        assert.typeof(validationResult.value, 'undefined')
        return validationResult
      },
    },
  },
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

        assert.typeof(value, 'boolean')
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

        assert.typeof(value, 'number')
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

        assert.typeof(value, 'string')
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

        assert.typeof(value, 'object')
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

        assert.typeof(value, 'array')
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
    [ALL_FORMATS]: [
      validateMinMax(value => size(value as object)),
      (result, spec) => {
        if (!spec.strict || !Array.isArray(spec.children)) {
          return
        }

        const expectedKeys = spec.children.map(child => child.path)
        const actualKeys = Object.keys(result.value)
        const extraKeys = difference(actualKeys, expectedKeys)
        assert.ok(extraKeys.length === 0, `unexpected properties: ${extraKeys.join(', ')}`)
      },
    ],
  },
  [ModelType.Array]: {
    [ALL_FORMATS]: [validateMinMax(value => size(value as any[]))],
  },
  [ModelType.DateTime]: {
    [ALL_FORMATS]: [validateMinMax(value => (value as Date).getTime())],
  },
}
