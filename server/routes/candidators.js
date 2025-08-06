import express from 'express';
import supabase from '../database/supabase.js';

const router = express.Router();

// Get all candidators with pagination and optional search
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';

    let query = supabase
      .from('candidators')
      .select('id, name, email, phone_number, city, state, url, resume_fetched, contact_extracted, sms_transferred, sms_status, created_at, updated_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ data, count });
  } catch (err) {
    console.error(err.message || err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get candidators by status
router.get('/status/:status', async (req, res) => {
  const { status } = req.params;
  try {
    let query = supabase.from('candidators').select('*').order('created_at', { ascending: false });
    switch (status) {
      case 'fetched':
        query = query.eq('resume_fetched', true);
        break;
      case 'extracted':
        query = query.eq('contact_extracted', true);
        break;
      case 'transferred':
        query = query.eq('sms_transferred', true);
        break;
      default:
        // no filter
        break;
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
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