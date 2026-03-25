declare module "node-vault-client" {
    export default class Vault {
        static boot(name: string, config: any): Vault;
        read(path: string): Promise<{ data: { data: Record<string, string> } }>;
    }
}
