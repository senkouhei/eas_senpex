import express from 'express';
import settingsService from '../services/SettingsService.js';
import { updateSettingsBulk } from '../database/settings.js';

const router = express.Router();

// Get settings
router.get('/', async (req, res) => {
  try {
    res.json(settingsService.getSettings());
  } catch (err) {
    console.error(err.message || err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update settings
router.put('/', async (req, res) => {
  const { OPENAI_API_KEY, SCRAPERAPI_KEY, TWILIO_API_KEY, TWILIO_PHONE_NUMBER } = req.body;
  try {
    await updateSettingsBulk({ OPENAI_API_KEY, SCRAPERAPI_KEY, TWILIO_API_KEY, TWILIO_PHONE_NUMBER });
    res.json({ success: true });
  } catch (err) {
    console.error(err.message || err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;