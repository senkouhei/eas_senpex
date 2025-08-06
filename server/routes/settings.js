import express from 'express';
import supabase from '../database/supabase.js';

const router = express.Router();

// Get settings
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .order('id', { ascending: false })
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116: No rows found
    res.json(data || {});
  } catch (err) {
    console.error(err.message || err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update settings
router.put('/', async (req, res) => {
  const { openai_api_key, telnyx_api_key, telnyx_phone_number } = req.body;
  try {
    // Check if settings exist
    const { data: existingSettings, error: selectError } = await supabase
      .from('settings')
      .select('id')
      .limit(1)
      .single();
    if (selectError && selectError.code !== 'PGRST116') throw selectError;
    let result;
    if (existingSettings) {
      // Update existing settings
      const { data, error } = await supabase
        .from('settings')
        .update({ openai_api_key, telnyx_api_key, telnyx_phone_number, updated_at: new Date().toISOString() })
        .eq('id', existingSettings.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      // Insert new settings
      const { data, error } = await supabase
        .from('settings')
        .insert([{ openai_api_key, telnyx_api_key, telnyx_phone_number }])
        .select()
        .single();
      if (error) throw error;
      result = data;
    }
    res.json(result);
  } catch (err) {
    console.error(err.message || err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;