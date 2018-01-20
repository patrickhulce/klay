export interface IModel {
  type(type: string): IModel
}

export interface IModelSpecification {
  type?: string
}

export interface IModelOptions {
  types: string[]
}
