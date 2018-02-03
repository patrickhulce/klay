import {assertions} from '../errors/validation-error'
import {ALL_FORMATS, IValidatorCoerce, ModelType, ValidationPhase} from '../typedefs'

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
