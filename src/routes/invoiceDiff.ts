import { Router } from 'express';
import invoiceDiffController from '@/controllers/invoiceDiffController';

const router = Router();

router.get('/', invoiceDiffController.getInvoiceDiff);

export default router;
