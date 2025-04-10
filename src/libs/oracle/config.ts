import fs from 'fs'

import type { ITns, ITnsConfig } from '@/types/oracleType'

const tns = require('tns').default

function getTnsString(con_tns: ITnsConfig): string {
  return `(DESCRIPTION = (ADDRESS_LIST = (ADDRESS = (PROTOCOL = ${con_tns.DESCRIPTION.ADDRESS_LIST.ADDRESS.PROTOCOL})(HOST = ${con_tns.DESCRIPTION.ADDRESS_LIST.ADDRESS.HOST})(PORT = ${
    con_tns.DESCRIPTION.ADDRESS_LIST.ADDRESS.PORT
  }))) (CONNECT_DATA =(SID = ${con_tns.DESCRIPTION.CONNECT_DATA.SID}) ${
    con_tns.DESCRIPTION.CONNECT_DATA.SRVR || con_tns.DESCRIPTION.CONNECT_DATA.SERVER
      ? `(SERVER = ${con_tns.DESCRIPTION.CONNECT_DATA.SRVR || con_tns.DESCRIPTION.CONNECT_DATA.SERVER})`
      : ''
  }))`
}

export const getConfig = async () => {
  const tnsPath = (process.env.TNS_PATH ? process.env.TNS_PATH : __dirname) + '/tnsnames.ora'
  const content = fs.readFileSync(tnsPath, 'utf-8')
  const allTns: ITns = tns(content)
  const tnsConnectString: Record<string, string> = {}

  for await (const key of Object.keys(allTns)) {
    const con_tns = allTns[key]

    if (con_tns.DESCRIPTION.ADDRESS_LIST) {
      tnsConnectString[key] = getTnsString(con_tns)
    }
  }

  return tnsConnectString
}
