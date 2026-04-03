import usersRepository from "../repositories/usersRepository";

export class UserService {
    // Injecting the repository ensures dependency injection principles are met for testing
    constructor(private readonly repo: typeof usersRepository) {}

    async getUsers() {
        return await this.repo.getUsers();
    }
}

export default new UserService(usersRepository);
