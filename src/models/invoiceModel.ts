import Oracle from '@/libs/oracle';

class InvoiceModel {
  private oracle: Oracle;

  constructor() {
    this.oracle = new Oracle(process.env.ORACLE_DB_NAME || 'ORCL');
  }

  async getInvoices(limit = 1) {
    return await this.oracle.query(`SELECT * FROM invoices LIMIT ${limit}`);
  }
}

export default new InvoiceModel();
