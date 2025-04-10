// Set application timezone to match server location
process.env.TZ = 'Asia/Bangkok';

import express from 'express';
import { initOracleClient } from 'oracledb';
import invoiceDiffRouter from './routes/invoiceDiff';

const app = express();
const PORT = process.env.PORT || 3000;

if (process.env.ORACLE_CLIENT_PATH) {
  console.log('ORACLE_CLIENT_PATH', process.env.ORACLE_CLIENT_PATH)

  try {
    initOracleClient({ libDir: process.env.ORACLE_CLIENT_PATH })
  } catch (err) {
    console.error('Failed to initialize Oracle Client:', err)
    throw new Error('Cannot load Oracle Client. Ensure ORACLE_CLIENT_PATH is set correctly.')
  }
} else {
  console.warn('ORACLE_CLIENT_PATH is not set. Ensure the Oracle Client is installed and configured.')
}

// Middleware
app.use(express.json());

// Routes
app.use('/invoice-diff', invoiceDiffRouter);

// Error handling
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js'

// 404 Handler
app.use(notFoundHandler)

// Error Handler
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
