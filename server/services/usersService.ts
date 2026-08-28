import { usersRepository } from "../repositories/usersRepository";
import { convertSnakeToCamelCase } from "../utils/keyConverter";

class UsersService {
    async getUsers() {
        const rows = await usersRepository.getUsers();
        return convertSnakeToCamelCase(rows);
    }
}

export const usersService = new UsersService();
