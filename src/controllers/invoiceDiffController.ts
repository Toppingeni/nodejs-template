import { Request, Response, NextFunction } from 'express';
import invoiceDiffService from '@/services/invoiceDiffService';

class InvoiceDiffController {
  async getInvoiceDiff(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await invoiceDiffService.getInvoiceDiff();
      res.json({ message: 'Invoice diff endpoint', data: result });
    } catch (error) {
      next(error);
    }
  }
}

export default new InvoiceDiffController();
