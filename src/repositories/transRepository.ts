import Oracle from "../libs/oracle";

class TransRepository {
    private oracle: Oracle;

    constructor() {
        this.oracle = new Oracle(
            process.env.ORACLE_DB_NAME,
            process.env.APP_ID
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
