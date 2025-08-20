import express from 'express';
import { getAnalyticsByDate, getAnalyticsByState } from '../database/analytics.js';
const router = express.Router();

// GET /api/analytics/sms-sent?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/sms-sent', async (req, res) => {
  let { start, end } = req.query;
  const today = new Date();
  const defaultEnd = today.toISOString().slice(0, 10);
  const defaultStart = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()).toISOString().slice(0, 10);
  start = start || defaultStart;
  end = end || defaultEnd;
  const data = await getAnalyticsByDate(start, end);
  res.json({ data });
});

// GET /api/analytics/sms-by-state
router.get('/sms-by-state', async (req, res) => {
  let { start, end } = req.query;
  const today = new Date();
  const defaultEnd = today.toISOString().slice(0, 10);
  const defaultStart = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()).toISOString().slice(0, 10);
  start = start || defaultStart;
  end = end || defaultEnd;
  const data = await getAnalyticsByState(start, end);
  res.json({ data });
});

export default router;