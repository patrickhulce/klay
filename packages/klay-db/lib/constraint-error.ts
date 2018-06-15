import {Assertions} from 'klay-core'

import {ConstraintType} from './typedefs'

export class ConstraintError extends Error {
  public readonly type?: ConstraintType
  public readonly propertyPath?: string[]

  public constructor(message: string, type?: ConstraintType) {
    super(message)
    this.name = 'ConstraintError'
    this.type = type
  }
}

export const constraintAssertions = new Assertions(msg => new ConstraintError(msg))
