import express from 'express';
import supabase from '../database/supabase.js';
import { getCandidatorsByStatus } from '../database/candidators.js';

const router = express.Router();

// Get all candidators with pagination and optional search
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    
    const { data, count } = await getCandidatorsByStatus('', page, limit, search);

    res.json({ data, count });
  } catch (err) {
    console.error(err.message || err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get candidators by status
router.get('/status/:status', async (req, res) => {
  const { status } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search || '';
  try {
    const { data, count } = await getCandidatorsByStatus(status, page, limit, search);
    
    res.json({ data, count });
  } catch (err) {
    console.error(err.message || err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add new candidator
router.post('/', async (req, res) => {
  const { name, email, phone_number, city, state, url } = req.body;
  try {
    const { data, error } = await supabase
      .from('candidators')
      .insert([{ name, email, phone_number, city, state, url }])
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err.message || err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update candidator
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone_number, city, state, url, resume_fetched, contact_extracted, sms_transferred, sms_status } = req.body;
  try {
    const { data, error } = await supabase
      .from('candidators')
      .update({
        name, email, phone_number, city, state, url,
        resume_fetched, contact_extracted, sms_transferred, sms_status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err.message || err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete candidator
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('candidators')
      .delete()
      .eq('id', id);
    if (error) throw error;
    res.json({ message: 'Candidator deleted successfully' });
  } catch (err) {
    console.error(err.message || err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;