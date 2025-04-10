import { Dialect } from 'sequelize'

export interface SequelizeConfig {
  username: string
  password: string
  database: string
  host: string
  port: number
  dialect: Dialect
  logging?: boolean
}

export const getConfig = (): SequelizeConfig => ({
  username: process.env.ORACLE_USER || '',
  password: process.env.ORACLE_PWD || '',
  database: 'YOUR_DB_NAME', // Need to replace with actual DB name
  host: 'localhost', // Need to replace with actual host
  port: 1521, // Default Oracle port
  dialect: 'oracle',
  logging: process.env.NODE_ENV === 'development'
})
