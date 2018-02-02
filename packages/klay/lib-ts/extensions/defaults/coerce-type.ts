import {IValidatorCoerce, ALL_FORMATS, ValidationPhase} from '../../typedefs'
import {assertions} from '../../errors/validation-error'

export const coerce: IValidatorCoerce = {
  boolean: {
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
  number: {
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
  string: {
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
  object: {
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
  array: {
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
