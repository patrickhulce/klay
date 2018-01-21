import * as _ from 'lodash'

interface IV8Error extends ErrorConstructor {
  captureStackTrace?(e: Error, c: any): void
}

export class AssertionError extends Error {
  public constructor(message: string) {
    super(message)
    this.name = 'AssertionError'

    const v8error = Error as IV8Error
    if (typeof v8error.captureStackTrace === 'function') {
      v8error.captureStackTrace(this, AssertionError)
    }
  }

  public static ok(value: any, message?: string): void {
    if (value) {
      return
    }

    throw new AssertionError(message || 'expected value to be truthy')
  }

  public static equal(value: any, expected: any, name: string = 'value'): void {
    if (_.isEqual(value, expected)) {
      return
    }

    const reprActual = AssertionError.getRepresentation(value)
    const reprExpected = AssertionError.getRepresentation(expected)
    throw new AssertionError(`expected ${reprActual} to equal ${reprExpected}`)
  }

  public static defined(value: any, name: string = 'value'): void {
    this.ok(typeof value !== 'undefined', `expected ${name} to be defined`)
  }

  public static nonNull(value: any, name: string = 'value'): void {
    this.ok(value !== null, `expected ${name} to be non-null`)
  }

  public static typeof(value: any, expectedType: string, name: string = 'value'): void {
    this.ok(typeof value === expectedType, `expected ${name} to have typeof ${expectedType}`)
  }

  public static oneOf(value: any, expectedValues: any[], name: string = 'value'): void {
    if (expectedValues.indexOf(value) >= 0) {
      return
    }

    const reprExpected = AssertionError.getRepresentation(expectedValues)
    throw new AssertionError(`expected ${name} to be one of ${reprExpected}`)
  }

  public static getRepresentation(value: any, limit: number = 3): string {
    if (!value || typeof value !== 'object' || limit <= 0) {
      return String(value)
    }

    if (_.isArray(value)) {
      const array = value as any[]
      const items = array
        .slice(0, limit)
        .map(item => AssertionError.getRepresentation(item, limit - 1))
        .join(', ')

      const continuation = limit < array.length ? ', ...' : ''
      return `[${items}${continuation}]`
    } else {
      const items = _.keys(value)
        .slice(0, limit)
        // tslint:disable-next-line
        .map(item => `${item}: ${AssertionError.getRepresentation(value[item], limit - 1)}`)
        .join(', ')

      const continuation = limit < _.size(value as object) ? ', ...' : ''
      return `{${items}${continuation}}`
    }
  }
}
