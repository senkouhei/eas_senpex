import express from 'express';
import supabase from '../database/supabase.js';

const router = express.Router();

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const totalCandidators = await supabase.from('candidators').select('id', { count: 'exact', head: true });
    const fetchedResumes = await supabase.from('candidators').select('id', { count: 'exact', head: true }).eq('resume_fetched', true);
    const extractedContacts = await supabase.from('candidators').select('id', { count: 'exact', head: true }).eq('contact_extracted', true);
    const transferredSMS = await supabase.from('candidators').select('id', { count: 'exact', head: true }).eq('sms_transferred', true);

    const stats = {
      totalCandidators: totalCandidators.count || 0,
      fetchedResumes: fetchedResumes.count || 0,
      extractedContacts: extractedContacts.count || 0,
      transferredSMS: transferredSMS.count || 0,
      lastUpdated: new Date().toISOString()
    };

    res.json(stats);
  } catch (err) {
    console.error(err.message || err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;