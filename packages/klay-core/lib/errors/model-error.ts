import {Assertions} from './assertions'

export class ModelError extends Error {
  public constructor(message: string) {
    super(message)
    this.name = 'ModelError'
  }
}

export const modelAssertions = new Assertions(msg => new ModelError(msg))
