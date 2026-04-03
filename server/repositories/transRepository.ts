import Oracle from "../libs/oracle";
import { config } from "../config/unifiedConfig";

class TransRepository {
    private oracle: Oracle | undefined;

    private getOracle() {
        if (!this.oracle) {
            this.oracle = new Oracle(
                config.ORACLE_DB_NAME || "ORCL",
                config.APP_ID || "",
            );
        }
        return this.oracle;
    }

    async getTrans() {
        this.getOracle();
        return "";
    }

    async getAllMachines() {
        this.getOracle();
        return "";
    }
}

export default new TransRepository();
