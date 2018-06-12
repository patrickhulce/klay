import {assert} from 'klay-core'
import {cloneDeep} from 'lodash'

import {
  IQuery,
  IQueryBuilder,
  IQueryFields,
  IQueryOrder,
  IQueryWhere,
  IWhereCondition,
  WhereValue,
} from './typedefs'

export class QueryBuilder implements IQueryBuilder {
  public query: IQuery

  public constructor(query?: IQuery) {
    this.query = query || {}
  }

  public where(
    keyOrWhere: string | IQueryWhere,
    value?: WhereValue | IWhereCondition,
  ): IQueryBuilder {
    this.query.where =
      typeof keyOrWhere === 'string'
        ? {...this.query.where, [keyOrWhere]: value}
        : (this.query.where = keyOrWhere)

    return this
  }

  public limit(value: number): IQueryBuilder {
    this.query.limit = value
    return this
  }

  public offset(value: number): IQueryBuilder {
    this.query.offset = value
    return this
  }

  public orderBy(value: IQueryOrder): IQueryBuilder {
    assert.typeof(value, 'array', 'orderBy')
    value.forEach(item => assert.typeof(item, 'object'))
    this.query.order = value
    return this
  }

  public fields(value: IQueryFields): IQueryBuilder {
    assert.typeof(value, 'array', 'fields')
    value.forEach(field => assert.typeof(field, 'array'))
    this.query.fields = value
    return this
  }

  public clone(): IQueryBuilder {
    return new QueryBuilder(cloneDeep(this.query))
  }
}
