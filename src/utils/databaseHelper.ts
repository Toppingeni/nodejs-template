import { ITnsConfig } from "../types/oracleType";

export function getTnsString(con_tns: ITnsConfig): string {
    return `(DESCRIPTION = (ADDRESS_LIST = (ADDRESS = (PROTOCOL = ${
        con_tns.DESCRIPTION.ADDRESS_LIST.ADDRESS.PROTOCOL
    })(HOST = ${con_tns.DESCRIPTION.ADDRESS_LIST.ADDRESS.HOST})(PORT = ${
        con_tns.DESCRIPTION.ADDRESS_LIST.ADDRESS.PORT
    }))) (CONNECT_DATA =(SID = ${con_tns.DESCRIPTION.CONNECT_DATA.SID}) ${
        con_tns.DESCRIPTION.CONNECT_DATA.SRVR ||
        con_tns.DESCRIPTION.CONNECT_DATA.SERVER
            ? `(SERVER = ${
                  con_tns.DESCRIPTION.CONNECT_DATA.SRVR ||
                  con_tns.DESCRIPTION.CONNECT_DATA.SERVER
              })`
            : ""
    }))`;
}
