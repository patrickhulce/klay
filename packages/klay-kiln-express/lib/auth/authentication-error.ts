export class AuthenticationError extends Error {
  public constructor() {
    super('not authenticated')
    this.name = 'AuthenticationError'
  }
}
