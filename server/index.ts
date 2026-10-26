import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { router } from './routes';
import { db } from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS setup
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-secret'],
}));

app.use(express.json({ limit: '5mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    totalPlayers: db.getPlayers().length,
    contestStatus: db.getContestSettings().status,
  });
});

// API Routes
app.use('/api', router);

// Explicit 404 handler for all unmatched API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Serve static frontend assets in production if built
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send('RCB Auction Predictor 2027 API is running. Start frontend via npm run client.');
    }
  });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🏏 RCB Auction Predictor 2027 API Server listening on http://0.0.0.0:${PORT}`);
  console.log(`⚡ Loaded ${db.getPlayers().length} players from official WPL 2027 auction list.`);
});
