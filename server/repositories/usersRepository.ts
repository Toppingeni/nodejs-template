import { getOracle } from "../libs/oracle";

interface UserRow {
    USER_ID: number;
    USERNAME: string;
    STATUS: string;
    CREATED_AT: string;
}

class UsersRepository {
    private get oracle() {
        return getOracle();
    }

    async getUsers(): Promise<UserRow[]> {
        const sql = `
            SELECT USER_ID, USERNAME, STATUS, CREATED_AT
            FROM USERS
            WHERE STATUS = 'A'
            ORDER BY CREATED_AT DESC`;

        return this.oracle.query<UserRow>(sql);
    }

    async getUserById(userId: number): Promise<UserRow | null> {
        const sql = `
            SELECT USER_ID, USERNAME, STATUS, CREATED_AT
            FROM USERS
            WHERE USER_ID = :userId AND STATUS = 'A'`;

        const rows = await this.oracle.query<UserRow>(sql, { userId });
        return rows[0] ?? null;
    }
}

export const usersRepository = new UsersRepository();
