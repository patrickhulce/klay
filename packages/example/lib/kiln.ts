import {IKiln, Kiln} from 'klay-kiln'
import {SQLDialect, SQLExtension} from 'klay-kiln-sql'
import {RouterExtension, RouteExtension, ActionType} from 'klay-kiln-express'

import {userModel} from './user'

export const kiln: IKiln = new Kiln()

export enum ModelID {
  User = 'user',
}

kiln.addModel({name: ModelID.User, model: userModel, meta: {plural: 'example_users'}})

const sqlOptions = {
  host: process.env.KLAY_MYSQL_HOST || 'localhost',
  database: process.env.KLAY_MYSQL_DB,
  user: process.env.KLAY_MYSQL_USER,
  password: process.env.KLAY_MYSQL_PASSWORD || '',
  dialect: SQLDialect.MySQL,
}

export const sqlExtension = new SQLExtension(sqlOptions)
kiln.addExtension({extension: sqlExtension})

const routeExtension = new RouteExtension({type: ActionType.List})
kiln.addExtension({extension: routeExtension})

const routerExtension = new RouterExtension({})
kiln.addExtension({extension: routerExtension})
