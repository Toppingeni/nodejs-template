import Sequelize = require('sequelize-oracle')
import { getConfig } from './config'

const config = getConfig()

const sequelize = new Sequelize({
  username: config.username,
  password: config.password,
  database: config.database,
  host: config.host,
  port: config.port,
  dialect: config.dialect,
  dialectOptions: {
    connectString: `${config.host}:${config.port}/${config.database}`
  },
  logging: config.logging
})

export default sequelize
