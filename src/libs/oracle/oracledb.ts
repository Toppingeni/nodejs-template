import type { Connection } from 'oracledb'
import { getConnection } from 'oracledb'

import { getConfig } from './config'

export type IOracleDB = ReturnType<typeof oracleDB>

async function oracleDB(mode: string) {
  const config = await getConfig()

  if (!config[mode]) throw new Error('Oracle connection string not found')

  return getConnection({
    user: process.env.ORACLE_USER || '',
    password: process.env.ORACLE_PWD || '',
    connectString: config[mode]
  })
}

export async function oracleConnection(mode: string, callback: (connection: Connection) => Promise<any>) {
  const connection = await oracleDB(mode)

  try {
    return await callback(connection)
  } catch (error) {
    throw error
  } finally {
    if (connection) {
      try {
        await connection.close()
      } catch (err) {
        console.error(err)
      }
    }
  }
}
