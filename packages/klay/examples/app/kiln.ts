import {IKiln, Kiln} from '../../lib'
import {SQLDialect, SQLExtension} from '../../lib'

import {accountModel} from './models/account'
import {userModel} from './models/user'
import {postModel} from './models/post'

export const kiln: IKiln = new Kiln()

export enum ModelId {
  Account = 'account',
  User = 'user',
  Post = 'post',
}

kiln.addModel({name: ModelId.Account, model: accountModel})
kiln.addModel({name: ModelId.User, model: userModel, meta: {tableName: 'example_users'}})
kiln.addModel({name: ModelId.Post, model: postModel})

const sqlOptions = {
  host: process.env.KLAY_MYSQL_HOST || 'localhost',
  database: process.env.KLAY_MYSQL_DB,
  user: process.env.KLAY_MYSQL_USER,
  password: process.env.KLAY_MYSQL_PASSWORD || '',
  dialect: SQLDialect.MySQL,
}

export const sqlExtension = new SQLExtension(sqlOptions)
kiln.addExtension({extension: sqlExtension})
