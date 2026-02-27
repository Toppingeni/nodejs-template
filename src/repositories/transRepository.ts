import Oracle from "../libs/oracle";
import { config } from "../config/unifiedConfig";

class TransRepository {
    private oracle: Oracle;

    constructor() {
        this.oracle = new Oracle(
            config.ORACLE_DB_NAME,
            config.APP_ID
        );
    }

    async getTrans() {
        return "";
    }

    async getAllMachines() {
        return "";
    }
}

export default new TransRepository();
