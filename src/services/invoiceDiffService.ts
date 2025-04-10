import invoiceModel from "../repositories/invoiceRepository";
import Invoice from "../libs/sequelize/models/invoiceModel";

class InvoiceDiffService {
    async getInvoiceDiff() {
        return await invoiceModel.getInvoices();
    }

    async getInvoiceSequelize(limit = 10) {
        return await Invoice.findAll({
            limit,
            order: [["date", "DESC"]],
        });
    }
}

export default new InvoiceDiffService();
