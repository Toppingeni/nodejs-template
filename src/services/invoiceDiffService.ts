import invoiceModel from '@/repositories/invoiceModel';
import Invoice from '@/models/invoiceSequelizeModel';

class InvoiceDiffService {
  async getInvoiceDiff() {
    return await invoiceModel.getInvoices();
  }

  async getInvoiceSequelize(limit = 10) {
    return await Invoice.findAll({
      limit,
      order: [['date', 'DESC']]
    });
  }
}

export default new InvoiceDiffService();
