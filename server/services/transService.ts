import transRepository from '../repositories/transRepository';

export class TransService {
    // Injecting the repository ensures dependency injection principles are met for testing
    constructor(private readonly repo: typeof transRepository) {}

    async getTransactions() {
        return await this.repo.getTrans();
    }

    async getAllMachines() {
        return await this.repo.getAllMachines();
    }
}

export default new TransService(transRepository);
