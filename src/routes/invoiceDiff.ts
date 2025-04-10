import { Router } from 'express';
import Oracle from '@/libs/oracle/index';

const router = Router();
const oracle = new Oracle('YOUR_DB_NAME'); // TODO: Replace with actual Oracle DB name from config

router.get('/', async (req, res, next) => {
  try {
    // TODO: Implement actual invoice diff logic
    const result = await oracle.query('SELECT * FROM invoices LIMIT 1');
    res.json({ message: 'Invoice diff endpoint', data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
