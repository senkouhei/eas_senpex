import express from 'express';
import { getAllSettings, updateSettingsBulk } from '../database/settings.js';
import * as botManager from '../bot/bot_manager.js';

const router = express.Router();

// Get settings
router.get('/', async (req, res) => {
  try {
    const settingsArr = await getAllSettings();
    // Convert array to object { name: value }
    const settings = {};
    for (const { name, value } of settingsArr) {
      settings[name] = value;
    }
    res.json(settings);
  } catch (err) {
    console.error(err.message || err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update settings
router.put('/', async (req, res) => {
  const { OPENAI_API_KEY, SCRAPERAPI_KEY, TWILIO_AUTH_TOKEN, TWILIO_ACCOUNT_SID, TWILIO_PHONE_NUMBER } = req.body;
  try {
    await updateSettingsBulk({ OPENAI_API_KEY, SCRAPERAPI_KEY, TWILIO_AUTH_TOKEN, TWILIO_ACCOUNT_SID, TWILIO_PHONE_NUMBER });
    res.json({ success: true });
  } catch (err) {
    console.error(err.message || err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Set bot statuses
router.put('/bots', async (req, res) => {
  const { botKey, enabled } = req.body;
  try {
    if (!botKey) return res.status(400).json({ error: 'Missing botKey' });
    if (enabled) {
      await updateSettingsBulk({ [botKey]: "ON" });
    } else {
      await updateSettingsBulk({ [botKey]: "OFF" });
      if (botManager.processes[botKey]) {
        botManager.processes[botKey].kill();
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err.message || err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;