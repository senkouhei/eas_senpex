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

    // const googleService = getGoogleServiceInstance();
    // if (googleService.init) await googleService.init();

    // const emails = await googleService.fetchIndeedEmails();
    // console.log('emails count', emails.length);
    // if (emails.length > 0) {
    //   let insertedCount = 0;
    //   for (const email of emails) {
    //     try {
    //       const data = await googleService.getEmailHtmlAndSender(email.id);
    //       // console.log('data', data);
    //       await insertCandidator({ gmail_id: email.id, gmail_name: data.sender, gmail_timestamp: data.datetime, url: data.resumeLink });
    //       insertedCount++;
    //       console.log('insertedCount', insertedCount);
    //       broadcast({ value: totalCandidators.count + insertedCount, receiver: 'All Candidators' });
    //     } catch (err) {
    //       console.error(err.message || err);
    //     }
    //   }
    // }

    // const indeedSheetData = await googleService.getIndeedSheetData("1tu6AlORO3JuhF9Ge9sp7fVONtoSMXGuqqBZRW4kBbC8");
    // console.log(indeedSheetData);

    res.json(stats);
  } catch (err) {
    console.error(err.message || err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;