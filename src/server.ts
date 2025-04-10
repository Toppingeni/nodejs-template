import 'module-alias/register';
import express from 'express';
import { initOracleClient } from 'oracledb';
import invoiceDiffRouter from '@/routes/invoiceDiff';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Oracle client if path is provided
if (process.env.ORACLE_CLIENT_PATH) {
  try {
    initOracleClient({ libDir: process.env.ORACLE_CLIENT_PATH });
  } catch (err) {
    console.error('Failed to initialize Oracle Client:', err);
    process.exit(1);
  }
}

// Middleware
app.use(express.json());

// Routes
app.use('/invoice-diff', invoiceDiffRouter);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
