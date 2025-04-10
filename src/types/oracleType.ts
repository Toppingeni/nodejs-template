export type ITnsConfig = {
  DESCRIPTION: {
    ADDRESS_LIST: {
      ADDRESS: { PROTOCOL: string; HOST: string; PORT: string }
    }
    CONNECT_DATA: { SID: string; SERVER?: string; SRVR?: string }
  }
}

export type ITns = Record<string, ITnsConfig>
export type IMssqlConfig = {
  user: string
  password: string
  server: string
  pool: {
    max: number
    min: number
    idleTimeoutMillis: number
  }
  options: {
    trustServerCertificate: boolean
  }
}

export type InOutParamsType = {
  [key: string]: {
    type: any
    value?: any
    dir?: unknown
  }
}

export type CommandsSpType = {
  spName: string
  input: InOutParamsType
  output: InOutParamsType | undefined
}
