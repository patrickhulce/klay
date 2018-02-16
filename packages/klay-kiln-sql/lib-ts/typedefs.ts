
export type PrimaryKey = string | number

export interface ISQLModel {
  findById(id: PrimaryKey): object
}
