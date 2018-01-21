export interface IModel {
  type(type: string): IModel
  format(format: string): IModel
}

export interface IModelSpecification {
  type?: string,
  format?: string,
}

export interface IModelOptions {
  types: string[],
  formats: {[typeName: string]: string[]},
}
