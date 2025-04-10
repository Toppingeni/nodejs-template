import invoiceModel from '@/models/invoiceModel';

class InvoiceDiffService {
  async getInvoiceDiff() {
    return await invoiceModel.getInvoices();
  }
}

export default new InvoiceDiffService();
