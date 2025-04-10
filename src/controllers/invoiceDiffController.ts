import { Request, Response, NextFunction } from 'express';
import invoiceDiffService from '../services/invoiceDiffService';

class InvoiceDiffController {
  async getInvoiceDiff(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await invoiceDiffService.getInvoiceDiff();
      res.json({ message: 'Invoice diff endpoint', data: result });
    } catch (error) {
      next(error);
    }
  }

  async getInvoiceSequelize(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await invoiceDiffService.getInvoiceSequelize(limit);
      res.json({ message: 'Invoice sequelize endpoint', data: result });
    } catch (error) {
      next(error);
    }
  }
}

export default new InvoiceDiffController();
