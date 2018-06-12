import {app} from './app'
import {sqlExtension} from './kiln'

async function run() {
  await sqlExtension.sync({force: true})
  app.listen(process.env.PORT || 3000)
}

run()
