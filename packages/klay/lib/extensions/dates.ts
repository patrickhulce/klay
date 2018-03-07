import {values} from 'lodash'
import {assertions} from '../errors/assertion-error'
import {
  FALLBACK_FORMAT,
  IValidatorCoerce,
  IValidatorFormats,
  ModelType,
  ValidationPhase,
} from '../typedefs'

export enum DateFormat {
  UnixTimestamp = 'unix-timestamp',
}

export const types = [ModelType.Date]

export const formats: IValidatorFormats = {
  [ModelType.Date]: values(DateFormat),
}

function areDatesMoreThanTwoDaysApart(dateA: Date, dateB: Date): boolean {
  return Math.abs(dateA.getTime() - dateB.getTime()) > 24 * 60 * 60 * 1000
}

function getDateFromString(value: string): Date | string {
  const date = new Date(value)
  const dateWithTz = new Date(`${value} 00:00:00 GMT`)

  if (isNaN(date.getTime())) {
    return value
  } else if (isNaN(dateWithTz.getTime()) || areDatesMoreThanTwoDaysApart(date, dateWithTz)) {
    return date
  } else {
    return dateWithTz
  }
}

function getDateFromNumber(value: number): Date | number {
  const date = new Date(value)
  return isNaN(date.getTime()) ? value : date
}

export const coerce: IValidatorCoerce = {
  [ModelType.Date]: {
    [FALLBACK_FORMAT]: {
      [ValidationPhase.CoerceType]: result => {
        if (result.value instanceof Date) {
          return result
        }

        let value = result.value
        if (typeof value === 'string') {
          value = getDateFromString(value)
        } else if (typeof value === 'number') {
          value = getDateFromNumber(value)
        }

        assertions.ok(value instanceof Date, 'expected value to be a date')
        return result.setValue(value)
      },
    },
    [DateFormat.UnixTimestamp]: {
      [ValidationPhase.CoerceType]: result => {
        if (result.value instanceof Date) {
          return result
        }

        let value = result.value
        if (typeof value === 'number') {
          value = getDateFromNumber(value * 1000)
        } else if (typeof value === 'string') {
          if (Number.isFinite(Number(value))) {
            value = getDateFromNumber(Number(value) * 1000)
          }
        }

        assertions.ok(value instanceof Date, 'expected value to be a date')
        return result.setValue(value)
      },
    },
  },
}
