import * as _ from 'lodash'

export interface IExtraErrorProperties {
  path?: string
  actual?: any
  expected?: any
}

export type ErrorCreator = (message: string) => Error

export class Assertions {
  private readonly _createError: ErrorCreator

  public constructor(createError: ErrorCreator) {
    this._createError = createError
  }

  private _throw(message: string, extra?: IExtraErrorProperties): void {
    const error = this._createError(message)
    _.assign(error, extra)

    const V8Error = Error as any // tslint:disable-line
    if (typeof V8Error.captureStackTrace === 'function') {
      V8Error.captureStackTrace(error)
    }

    error.stack = error
      .stack!.split('\n')
      .filter(l => !/at Assertions/.test(l))
      .join('\n')
    throw error
  }

  public ok(value: any, message?: string, extra?: IExtraErrorProperties): void {
    if (value) {
      return
    }

    this._throw(message || 'expected value to be truthy', extra)
  }

  public equal(actual: any, expected: any, path: string = 'value'): void {
    if (_.isEqual(actual, expected)) {
      return
    }

    const reprActual = Assertions.getRepresentation(actual, 1)
    const reprExpected = Assertions.getRepresentation(expected, 1)
    this._throw(`expected ${path} (${reprActual}) to equal ${reprExpected}`, {
      path,
      actual,
      expected,
    })
  }

  public defined(actual: any, path: string = 'value'): void {
    this.ok(typeof actual !== 'undefined', `expected ${path} to be defined`, {path, actual})
  }

  public nonNull(actual: any, path: string = 'value'): void {
    this.ok(actual !== null, `expected ${path} to be non-null`, {path, actual})
  }

  public typeof(actual: any, expectedType: string, path: string = 'value'): void {
    const actualType = Array.isArray(actual) ? 'array' : typeof actual
    const reprActual = Assertions.getRepresentation(actual, 1)
    this.ok(
      actualType === expectedType,
      `expected ${path} (${reprActual}) to have typeof ${expectedType}`,
      {path, actual: actualType, expected: expectedType},
    )
  }

  public oneOf(actual: any, expectedValues: any[], path: string = 'value'): void {
    if (expectedValues.indexOf(actual) >= 0) {
      return
    }

    const reprActual = Assertions.getRepresentation(actual, 1)
    const reprExpected = Assertions.getRepresentation(expectedValues)
    this._throw(`expected ${path} (${reprActual}) to be one of ${reprExpected}`, {
      path,
      actual,
      expected: expectedValues,
    })
  }

  public match(actual: any, expected: RegExp, path: string = 'value'): void {
    if (expected.test(actual as string)) {
      return
    }

    const reprActual = Assertions.getRepresentation(actual, 0)
    const reprExpected = Assertions.getRepresentation(expected)
    this._throw(`expected ${path} (${reprActual}) to match ${reprExpected}`, {
      path,
      actual,
      expected,
    })
  }

  // tslint:disable
  public getRepresentation(value: any, limit: number = 3): string {
    return Assertions.getRepresentation(value, limit)
  }
  // tslint:enable

  public static getRepresentation(value: any, limit: number = 3): string {
    if (!value || typeof value !== 'object' || limit <= 0 || value instanceof RegExp) {
      return String(value)
    }

    if (_.isArray(value)) {
      const array = value as any[]
      const items = array
        .slice(0, limit)
        .map(item => Assertions.getRepresentation(item, limit - 1))
        .join(', ')

      const continuation = limit < array.length ? ', ...' : ''
      return `[${items}${continuation}]`
    } else {
      const items = _.keys(value)
        .slice(0, limit)
        // tslint:disable-next-line
        .map(item => `${item}: ${Assertions.getRepresentation(value[item], limit - 1)}`)
        .join(', ')

      const continuation = limit < _.size(value as object) ? ', ...' : ''
      return `{${items}${continuation}}`
    }
  }
}
