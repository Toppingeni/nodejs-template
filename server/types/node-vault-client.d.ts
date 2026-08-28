declare module "node-vault-client" {
    export class Lease {
        getValue(key: string): string;
        getData(): Record<string, unknown>;
        isRenewable(): boolean;
    }

    export default class Vault {
        static boot(name: string, config: unknown): Vault;
        read(path: string): Promise<Lease>;
    }
}
